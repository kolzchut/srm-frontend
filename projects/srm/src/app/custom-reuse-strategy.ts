import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

export class CustomReuseStrategy implements RouteReuseStrategy {

    handlers: {[key: string]: DetachedRouteHandle} = {};

    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        return !!route.data.group;
    }

    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        if (route?.routeConfig?.path) {
            this.handlers[route.routeConfig.path] = handle;
        }
    }

    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        return !!route?.routeConfig?.path && !!this.handlers[route.routeConfig.path];
    }

    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        if (!route.routeConfig) return null;
        if (!route.routeConfig.path) return null;
        return this.handlers[route.routeConfig.path];
    }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return future.data.group === curr.data.group;
    }
}