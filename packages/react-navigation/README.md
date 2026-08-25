# React-Native Monitoring for `react-navigation` components

Motadata *Real User Monitoring (RUM)* enables you to visualize and analyze the real-time performance and user journeys of your application’s individual users. This specific package adds support to the [`react-navigation`][1] library.

## Setup

**Note**: This package is an integration for the [`react-navigation`][1] library, please make sure you first install and set up the core [`@motadata365/mobile-react-native`][2] SDK.

To install with NPM, run:

```sh
npm install @motadata365/mobile-react-navigation
```

To install with Yarn, run:

```sh
yarn add @motadata365/mobile-react-navigation
```

### Track view navigation

To track changes in navigation as RUM Views, set the `onReady` callback of your `NavigationContainer` component as follow. You can use the optional `NavigationTrackingOptions` parameter to replace the default behaviour of the tracker regarding views, their names and their navigation parameters.

```js
import * as React from 'react';
import { MdRumReactNavigationTracking, ParamsTrackingPredicate, ViewNamePredicate, ViewTrackingPredicate } from '@motadata365/mobile-react-navigation';
import { Route } from "@react-navigation/native";

// Sets a custom name for a tracked view
const viewNamePredicate: ViewNamePredicate = function customViewNamePredicate(route: Route<string, any | undefined>, trackedName: string) {
  return "My custom View Name"
}

// Decides if a view should be tracked or not
const viewTrackingPredicate: ViewTrackingPredicate = function customViewTrackingPredicate(route: Route<string, any | undefined>) { 
  if (route.name === "AlertModal") {
    return false;
  }

  return true;
}

// Allows to define what navigation parameters should be tracked for a specific view
const paramsTrackingPredicate: ParamsTrackingPredicate = function customParamsTrackingPredicate(route: Route<string, any | undefined>) { 
  const filteredParams: any = {};
  if (route.params?.creditCardNumber) {
    filteredParams["creditCardNumber"] = "XXXX XXXX XXXX XXXX";
  }

  if (route.params?.username) {
    filteredParams["username"] = route.params.username;
  }

  return filteredParams;
}

const navigationTrackingOptions: NavigationTrackingOptions = {
  viewNamePredicate,
  viewTrackingPredicate,
  paramsTrackingPredicate,
}

function App() {
  const navigationRef = React.useRef(null);
  return (
    <View>
      <NavigationContainer ref={navigationRef} onReady={() => {
        MdRumReactNavigationTracking.startTrackingViews(navigationRef.current, navigationTrackingOptions)
      }}>
        // …
      </NavigationContainer>
    </View>
  );
}
```

These predicates are optional, and when not set the default behavior will be used for each one of them. The default behaviors are as follows:

- ViewNamePredicate - directly forwards the view given name to RUM.
- ViewTrackingPredicate - tracks all views on RUM.
- ParamsTrackingPredicate - does not forward any parameters to RUM.

**Note**: Only one `NavigationContainer` can be tracked at the time. If you need to track another container, stop tracking the previous one first, using `MdRumReactNavigationTracking.stopTrackingViews()`.


[1]: https://github.com/react-navigation/react-navigation
[2]: https://github.com/motadata2025/md-sdk-reactnative/tree/motadata-dev/packages/core
