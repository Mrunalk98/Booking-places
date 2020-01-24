import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // tslint:disable-next-line: variable-name
  private _userIsAuth = false;
  // tslint:disable-next-line: variable-name
  private _userId = 'u2';
  constructor() { }

  get userIsAuth() {
    return this._userIsAuth;
  }

  get  userId() {
    return this._userId;
  }

  login() {
    this._userIsAuth = true;
  }

  logout() {
    this._userIsAuth = false;
  }
}
