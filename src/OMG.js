/**
 * Implementazione rudimentale per eseguire un minimo di throttling
 * delle risposte ai link.
 * Perde lo stato se il programma è riavviato, NBD.
 */
class OMG {
  constructor() {
    this.lastOMG = new Date(0);
  }

  /**
   * Ritorna la funzione in ingresso solo se è il giorno è diverso
   * o sono passate almeno 24 ore dall'ultimo messaggio.
   * 
   * @param {function} fn 
   */
  omg(fn) {
    const now = new Date();
    const zero = new Date(0);
    if (now.getDate() != this.lastOMG.getDate() ||
      now - this.lastOMG > zero.setDate(zero.getDate() + 1)) {
      this.lastOMG = now;
      return fn;
    }
    return () => { };
  }
}
exports.OMG = OMG;
