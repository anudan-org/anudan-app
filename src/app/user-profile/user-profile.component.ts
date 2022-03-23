import { UtilsService } from './../utils.service';
import { Component, ElementRef, OnInit } from '@angular/core';
import { User } from '../model/user';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ErrorMessage } from '../model/error-message';
import { AppComponent } from '../app.component';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  styles: [`
        ::ng-deep .mat-tooltip  {
            white-space: pre-line    !important;
            text-align: left;
            font-size: 12px;
        }
  `]
})
export class UserProfileComponent implements OnInit {

  user: User;
  constructor(private http: HttpClient, private elem: ElementRef, private router: Router, public appComp: AppComponent, private toastr: ToastrService, private util: UtilsService) { }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('USER'));
  }

  savePasswordChange() {
    const oldPwdElem = this.elem.nativeElement.querySelector('#old_pwd');
    const newPwdElem = this.elem.nativeElement.querySelector('#new_pwd');
    const repeatPwdElem = this.elem.nativeElement.querySelector('#repeat_new_pwd');

    if (!oldPwdElem.value) {
      alert('Please enter your current password');
      return;
    }

    if (!newPwdElem.value) {
      alert('Please enter a valid new password');
      return;
    }
    if (!repeatPwdElem.value) {
      alert('Please enter a valid repeat password');
      return;
    }
    if (repeatPwdElem.value !== newPwdElem.value) {
      alert('Your new and repeat passwords do not match');
      return;
    }
    const pattern: RegExp = this.util.getEmailPattern();
    if (!pattern.test(newPwdElem.value) || !pattern.test(repeatPwdElem.value)) {
      alert('Your new and repeat passwords do not match the allowed pattern');
      return;
    }
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    let url = '/api/users/' + this.user.id + '/validate-pwd';
    this.http.post(url, oldPwdElem.value, httpOptions).subscribe((result: ErrorMessage) => {
      if (!result.success) {
        alert(result.message);
      } else {
        url = '/api/users/' + this.user.id + '/pwd';
        this.http.post(url, [oldPwdElem.value, newPwdElem.value, repeatPwdElem.value], httpOptions).subscribe((user: User) => {
          localStorage.removeItem('USER');
          localStorage.setItem('USER', JSON.stringify(user));
          this.appComp.loggedInUser = user;
          const changePwdModalElem = this.elem.nativeElement.querySelector('#changePwdModal');
          oldPwdElem.value = '';
          newPwdElem.value = '';
          repeatPwdElem.value = '';
          $(changePwdModalElem).modal('hide');
          this.appComp.logout();
        }, error => {
          const errorMsg = error as HttpErrorResponse;
          console.log(error);
          const x = { 'enableHtml': true, 'preventDuplicates': true } as Partial<IndividualConfig>;
          const config: Partial<IndividualConfig> = x;
          if (errorMsg.error.message === 'Token Expired') {
            this.toastr.error("Your session has expired", 'Logging you out now...', config);
            setTimeout(() => { this.appComp.logout(); }, 4000);
          } else {
            this.toastr.error(errorMsg.error.message, "Error", config);
          }


        });
      }
    }, error => {
      const errorMsg = error as HttpErrorResponse;
      console.log(error);
      const x = { 'enableHtml': true, 'preventDuplicates': true } as Partial<IndividualConfig>;
      const config: Partial<IndividualConfig> = x;
      if (errorMsg.error.message === 'Token Expired') {
        this.toastr.error("Your session has expired", 'Logging you out now...', config);
        setTimeout(() => { this.appComp.logout(); }, 4000);
      } else {
        this.toastr.error(errorMsg.error.message, "20 We encountered an error", config);
      }


    });
  }


  updateProfile() {
    console.log(this.user);
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
        'Authorization': localStorage.getItem('AUTH_TOKEN')
      })
    };

    const url = '/api/users/' + this.user.id;
    this.http.put(url, this.user, httpOptions).subscribe((user: User) => {
      localStorage.removeItem('USER');

      user.permissions = new Array();
      for (const userRole of user.userRoles) {
        if (userRole.role.permissions) {
          for (const perm of userRole.role.permissions) {
            user.permissions.push(perm.permission);
          }
        }
      }
      this.appComp.loggedInUser = user;
      localStorage.setItem('USER', JSON.stringify(user));
    }, error => {
      const errorMsg = error as HttpErrorResponse;
      console.log(error);
      const x = { 'enableHtml': true, 'preventDuplicates': true } as Partial<IndividualConfig>;
      const config: Partial<IndividualConfig> = x;
      if (errorMsg.error.message === 'Token Expired') {
        this.toastr.error("Your session has expired", 'Logging you out now...', config);
        setTimeout(() => { this.appComp.logout(); }, 4000);
      } else {
        this.toastr.error(errorMsg.error.message, "21 We encountered an error", config);
      }


    });
  }

  getStringFromHtml(text) {
    const html = text;
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  loadImage() {
    console.log("image selection");
  }

  processProfilePic(ev) {
    const file: File = ev.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      this.user.userProfile = reader.result.toString();
      let formData = new FormData();
      formData.append("file", file);

      const httpOptions = {
        headers: new HttpHeaders({
          'X-TENANT-CODE': localStorage.getItem('X-TENANT-CODE'),
          'Authorization': localStorage.getItem('AUTH_TOKEN')
        })
      };
      const url = 'api/users/' + this.appComp.loggedInUser.id + '/profile';

      this.http.post(url, formData, httpOptions).subscribe(() => {

        this.appComp.profile = "/api/public/images/profile/" + this.user.id + '?' + (new Date().getTime()).toString();
      });
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };

  }
}
