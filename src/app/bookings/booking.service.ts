import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { take, delay, tap, switchMap , map} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
  bookingFrom: string;
  bookingTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // tslint:disable-next-line: variable-name
  private _bookings = new BehaviorSubject<Booking[]>([]);
  constructor(private authService: AuthService,
              private http: HttpClient) { }

  get bookings() {
    return this._bookings.asObservable();
  }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId: string;
    const newBooking = new Booking(
      Math.random().toString(),
      placeId,
      this.authService.userId,
      placeTitle,
      placeImage,
      firstName,
      lastName,
      guestNumber,
      dateFrom,
      dateTo
    );
    return this.http
    .post<{ name: string }>(
      'https://ionic-angular-booking-d3c04.firebaseio.com/bookings.json',
      {...newBooking, id: null}
    )
    .pipe(
      switchMap(resData => {
        generatedId = resData.name;
        return this.bookings;
      }),
      take(1),
      tap(bookings => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      })
    );
  }

  cancelBooking(bookingId: string) {
    return this.http
    .delete(`https://ionic-angular-booking-d3c04.firebaseio.com/bookings/${bookingId}.json`)
    .pipe(switchMap(() => {
      return this.bookings;
    }),
    take(1),
    tap(bookings => {
      this._bookings.next(bookings.filter(b => b.id !== bookingId));
    })
    );
    // return this.bookings.pipe(take(1), delay(1000), tap(bookings => {
    //   this._bookings.next(bookings.filter(b => b.id !== bookingId));
    // }));
  }

  fetchBookings() {
    return this.http
    .get<{ [key: string]: BookingData }>(
      `https://ionic-angular-booking-d3c04.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${this.authService.userId}"`)
    .pipe(
      map( bookingData => {
        const bookings = [];
        for (const key in bookingData) {
          if (bookingData.hasOwnProperty(key)) {
            bookings.push(new Booking(
              key,
              bookingData[key].placeId,
              bookingData[key].userId,
              bookingData[key].placeTitle,
              bookingData[key].placeImage,
              bookingData[key].firstName,
              bookingData[key].lastName,
              bookingData[key].guestNumber,
              new Date (bookingData[key].bookingFrom),
              new Date (bookingData[key].bookingTo)
            ));
          }
        }
        return bookings;
      }),
      tap(bookings => {
        this._bookings.next(bookings);
      })
    );
  }
}
