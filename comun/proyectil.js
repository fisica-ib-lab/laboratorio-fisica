/* Movimiento de proyectiles.
   Sin aire: ecuaciones exactas con aceleración uniforme (a = −g en vertical, 0 en horizontal).
   Con aire: resistencia proporcional al cuadrado de la rapidez, a = −g ŷ − k |v| v, integrada con
   Runge–Kutta de orden 4 (paso 0,5 ms). Solo se usa para comparar de forma cualitativa.
   Ejes: x horizontal (derecha +), y vertical (arriba +); el suelo de llegada es y = 0.
   El instante de llegada es la primera vez que y = 0 con el proyectil bajando (t > 0). */

(function (raiz) {
  'use strict';
  const G = 9.81;                         // m s⁻² (Cuadernillo de datos)
  const RAD = Math.PI / 180;

  function Proyectil(h, v, anguloGrados, opciones) {
    opciones = opciones || {};
    this.h = h; this.v0 = v; this.angulo = anguloGrados;
    this.g = opciones.g || G;
    this.k = opciones.k || 0;             // m⁻¹ (0: sin aire)
    const th = anguloGrados * RAD;
    // valores «redondos» exactos para 0° y 90°
    this.ux = anguloGrados === 90 ? 0 : v * Math.cos(th);
    this.uy = anguloGrados === 0 ? 0 : v * Math.sin(th);
    if (this.k > 0) this._integrar();
    else {
      const g = this.g, uy = this.uy;
      this.duracion = (uy + Math.sqrt(uy * uy + 2 * g * h)) / g;
      this.tCumbre = uy > 0 ? uy / g : 0;
    }
  }

  // ---------- Con aire: integración numérica ----------
  Proyectil.prototype._derivada = function (s) {
    const vel = Math.hypot(s[2], s[3]);
    return [s[2], s[3], -this.k * vel * s[2], -this.g - this.k * vel * s[3]];
  };
  Proyectil.prototype._integrar = function () {
    const dt = 0.0005, est = [[0, this.h, this.ux, this.uy]];
    let s = est[0], n = 0;
    const suma = (a, b, f) => a.map((x, i) => x + f * b[i]);
    while (n < 40000) {
      const k1 = this._derivada(s), k2 = this._derivada(suma(s, k1, dt / 2)),
        k3 = this._derivada(suma(s, k2, dt / 2)), k4 = this._derivada(suma(s, k3, dt));
      const sig = s.map((x, i) => x + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      est.push(sig); n++;
      if (sig[1] <= 0 && sig[3] < 0) break;
      s = sig;
    }
    this._dt = dt; this._est = est;
    // instante de llegada: raíz de y(t) en el último paso (interpolación de Hermite)
    let a = (n - 1) * dt, b = n * dt;
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (this._estado(m)[1] > 0) a = m; else b = m; }
    this.duracion = (a + b) / 2;
    // cumbre: donde vy cambia de signo
    this.tCumbre = 0;
    if (this.uy > 0) {
      let i = 0; while (i + 1 < est.length && est[i + 1][3] > 0) i++;
      let p = i * dt, q = (i + 1) * dt;
      for (let j = 0; j < 60; j++) { const m = (p + q) / 2; if (this._estado(m)[3] > 0) p = m; else q = m; }
      this.tCumbre = (p + q) / 2;
    }
  };
  // Estado (x, y, vx, vy) en t por interpolación cúbica de Hermite entre pasos
  Proyectil.prototype._estado = function (t) {
    const dt = this._dt, est = this._est;
    let i = Math.floor(t / dt);
    if (i < 0) return est[0].slice();
    if (i >= est.length - 1) i = est.length - 2;
    const s0 = est[i], s1 = est[i + 1], d0 = this._derivada(s0), d1 = this._derivada(s1);
    const u = (t - i * dt) / dt, h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    return s0.map((x, j) => h00 * x + h10 * dt * d0[j] + h01 * s1[j] + h11 * dt * d1[j]);
  };

  // ---------- Valores en un instante (t se limita a [0, duración]) ----------
  Proyectil.prototype.limitar = function (t) { return Math.min(Math.max(t, 0), this.duracion); };
  Proyectil.prototype.x = function (t) {
    t = this.limitar(t);
    return this.k > 0 ? this._estado(t)[0] : this.ux * t;
  };
  Proyectil.prototype.y = function (t) {
    t = this.limitar(t);
    return this.k > 0 ? this._estado(t)[1] : this.h + this.uy * t - 0.5 * this.g * t * t;
  };
  Proyectil.prototype.vx = function (t) {
    t = this.limitar(t);
    return this.k > 0 ? this._estado(t)[2] : this.ux;
  };
  Proyectil.prototype.vy = function (t) {
    t = this.limitar(t);
    return this.k > 0 ? this._estado(t)[3] : this.uy - this.g * t;
  };
  Proyectil.prototype.ax = function (t) {
    if (!this.k) return 0;
    const s = this._estado(this.limitar(t)); return this._derivada(s)[2];
  };
  Proyectil.prototype.ay = function (t) {
    if (!this.k) return -this.g;
    const s = this._estado(this.limitar(t)); return this._derivada(s)[3];
  };
  Proyectil.prototype.rapidez = function (t) { return Math.hypot(this.vx(t), this.vy(t)); };
  // ángulo de la velocidad con la horizontal, en grados (negativo si baja)
  Proyectil.prototype.anguloV = function (t) { return Math.atan2(this.vy(t), this.vx(t)) / RAD; };

  Proyectil.prototype.alcance = function () { return this.x(this.duracion); };
  Proyectil.prototype.alturaMax = function () { return this.y(this.tCumbre); };

  // Lista de puntos de una magnitud: 'tray' da (x, y); el resto, (t, valor)
  Proyectil.prototype.puntos = function (mag, n, hasta) {
    n = n || 120;
    const fin = hasta === undefined ? this.duracion : Math.min(hasta, this.duracion), r = [];
    for (let i = 0; i <= n; i++) {
      const t = fin * i / n;
      if (mag === 'tray') r.push([this.x(t), this.y(t)]);
      else r.push([t, this[mag](t)]);
    }
    return r;
  };

  const api = { Proyectil, G, RAD };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.ProyectilFisica = api;
})(this);
