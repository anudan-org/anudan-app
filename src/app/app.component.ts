import {Component} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Router, ActivatedRoute, ParamMap} from '@angular/router';

import {AppConfig} from './model/app-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  loggedIn = false;

  title = 'anudan.org';
  public appConfig: AppConfig = {
    appName: '',
    logoUrl: '',
    navbarColor: '#e3f2fd;',
    tenantCode: ''
  };

  org: string;
  public defaultClass = '';

  constructor(private httpClient: HttpClient, private router: Router, private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.initAppUI();
  }

  isLocalhost() {
    return (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  }

  initAppUI() {
    const hostName = this.isLocalhost() ? this.queryParam() : this.subdomain();
    this.getAppUI(hostName);
  }

  subdomain(): string {
    const hostName = location.hostname;
    let subDomain = '';
    if (hostName !== '127.0.0.1') {
      const arr = hostName.split('.');
      if (arr.length > 1) {
        subDomain = arr[0];
      }
    }
    return subDomain;
  }


  getAppUI(hostName) {
    console.log('hostName = ' + hostName);
    const url = '/api/app/config/'.concat(hostName);
    this.httpClient.get<HttpResponse<AppConfig>>(url, {observe: 'response'}).subscribe((response) => {
      const newObj: any = response.body;
      this.appConfig = newObj as AppConfig;
      localStorage.setItem('X-TENANT-CODE', this.appConfig.tenantCode);

    });
    if (!hostName) {
      this.defaultClass = ' navbar fixed-top navbar-expand-lg navbar-light';

    }
  }

  queryParam() {
    const name = this.getQueryStringValue('org');

    return name;

    // this.route.queryParamMap.subscribe(
    //   (queryParams: ParamMap) => {
    //     console.log(queryParams);
    //     return queryParams.get('org');
    //   }
    // );
  }

  getQueryStringValue(key: string): string {
    return decodeURIComponent(location.search.replace(new RegExp('^(?:.*[&\\?]' + encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
  }

  grateeRegistration() {
    console.log('grantee login');
    this.router.navigate(['/grantee/registration']);
  }

}
