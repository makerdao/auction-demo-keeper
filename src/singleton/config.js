
class Config {

  constructor() {

  }

  set vars ( vars ) { this._vars = vars; }
  get vars () { return this._vars; }

}

export default (new Config());
