import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

import { Place } from './place.model';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, switchMap} from 'rxjs/operators';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imgUrl: string;
  price: number;
  title: string;
  userId: string;

}

@Injectable({
  providedIn: 'root'
})

export class PlacesService {
  constructor(private authService: AuthService, private http: HttpClient) { }
  // tslint:disable-next-line: variable-name
  private _places = new BehaviorSubject<Place[]> ([]);
  // [
  //   new Place(
  //     'p1',
  //     'Mumbai',
  //     'India’s most-populous city',
  //      tslint:disable-next-line: max-line-length
  //     'https://akm-img-a-in.tosshub.com/indiatoday/images/story/201910/mumbai_flooding_climate_change-770x433.jpeg?JseeWbDY59gpdDhrkw2DBMeyGH32y1e4',
  //     250,
  //     new Date('2020-01-01'),
  //     new Date ('2020-12-31'),
  //     'u1'
  //   ),
  //   new Place(
  //     'p2',
  //     'Nagpur',
  //     'India’s orange city',
  //     'https://images.livemint.com/img/2019/11/08/600x338/Nagpurmetro_1573225681389.jpg',
  //     150,
  //     new Date('2020-01-01'),
  //     new Date ('2020-12-31'),
  //     'u2'
  //   ),
  //   new Place(
  //     'p3',
  //     'Pune',
  //     'It is the second largest city in the Indian state of Maharashtra',
  //     'https://i.ytimg.com/vi/oHpVlQ4sEq0/maxresdefault.jpg',
  //     200,
  //     new Date('2020-01-01'),
  //     new Date ('2020-12-31'),
  //     'u3'
  //   )
  // ];

  fetchPlaces() {
    return this.http
    .get<{[key: string]: PlaceData}>('https://ionic-angular-booking-d3c04.firebaseio.com/offered-places.json')
    .pipe(map(resData => {
      const places = [];
      for (const key in resData) {
        if (resData.hasOwnProperty(key)) {
          places.push(new Place(
            key,
            resData[key].title,
            resData[key].description,
            resData[key].imgUrl,
            resData[key].price,
            new Date (resData[key].availableFrom),
            new Date (resData[key].availableTo),
            resData[key].userId
          ));
        }
      }
      return places;
      // return [];
    }),
    tap(places => {
      this._places.next(places);
    })
    );
  }
  get places() {
    return this._places.asObservable();
  }

  getPlace(id: string) {
    // return this.places.pipe(take(1), map(places => {
    //   return {...places.find(p => p.id === id)};
    // }));

    return this.http
    .get<PlaceData>(`https://ionic-angular-booking-d3c04.firebaseio.com/offered-places/${id}.json`)
    .pipe(
      map(placeData => {
        return new Place(
          id,
          placeData.title,
          placeData.description,
          placeData.imgUrl,
          placeData.price,
          new Date(placeData.availableFrom),
          new Date(placeData.availableTo),
          placeData.userId
        );
      })
    );
  }

  addPlaces(title: string, description: string, price: number, dateFrom: Date, dateTo: Date) {
    let generatedId: string;
    const newPlace = new Place(
      Math.random().toString(),
      title,
      description,
      'https://images.livemint.com/img/2019/11/08/600x338/Nagpurmetro_1573225681389.jpg',
      price,
      dateFrom,
      dateTo,
      this.authService.userId
    );
    return this.http
      .post<{ name: string }>('https://ionic-angular-booking-d3c04.firebaseio.com/offered-places.json',
      {...newPlace, id: null}
      )
      .pipe(
        switchMap(resData => {
          generatedId = resData.name;
          return this.places;
        }),
        take(1),
        tap(places => {
          newPlace.id = generatedId;
          this._places.next(places.concat(newPlace));
        })
      );

  //   return this.places.pipe(take(1), delay(1000), tap(places => {
  //     this._places.next(places.concat(newPlace));
  //   })
  // );
  }
  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    return this.places.pipe(
      take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {

          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatedPlaces = [...places] ;
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imgUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId
        );
        return this.http.put(`https://ionic-angular-booking-d3c04.firebaseio.com/offered-places/${placeId}.json`,
        { ...updatedPlaces[updatedPlaceIndex], id: null});
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );


    // return this.places.pipe(take(1), delay(1000), tap(places => {
    //  const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
    //  const updatedPlaces = [...places] ;
    //  const oldPlace = updatedPlaces[updatedPlaceIndex];
    //  updatedPlaces[updatedPlaceIndex] = new Place(
    //    oldPlace.id,
    //    title,
    //    description,
    //    oldPlace.imgUrl,
    //    oldPlace.price,
    //    oldPlace.availableFrom,
    //    oldPlace.availableTo,
    //    oldPlace.userId
    //   );
    //  this._places.next(updatedPlaces);
    // }));
  }
}
