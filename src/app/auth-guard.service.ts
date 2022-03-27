import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot, ActivatedRoute } from '@angular/router';

@Injectable()
export class AuthGuardService implements CanActivate {

  parameters: any;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.parameters = params;
    });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = false;
    const params = route.queryParams;
    if (params && params.action === 'registration') {
      this.router.navigate(['/registration'], { queryParams: { g: params.g, r: params.r, d: params.d, email: params.email, org: params.org, type: params.type } });
      return false;
    } else if (params && params.action === 'login') {
      this.router.navigate(['/login'], { queryParams: { g: params.g, r: params.r, d: params.d, email: params.email, org: params.org, type: params.type } });
      return false;
    } else if (params && params.action === 'reset-password') {
      this.router.navigate(['/setnewpassword'], { queryParams: { email: params.email, key: params.key, org: params.org } });
      return false;
    } else {
      this.router.navigate(['/home']);
    }
  }

}