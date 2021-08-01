import { createSelector } from '@reduxjs/toolkit';

const appNotification = state => state.notification.appNotification;
const appNotificationType = state => state.notification.appNotification.type;
const appNotificationMessage = state => state.notification.appNotification.message;

export const getAppNotification = createSelector(
    [appNotification], notification => notification
);

export const getAppNotificationType = createSelector(
    [appNotificationType], notificationType => notificationType
);

export const getAppNotificationMessage = createSelector(
    [appNotificationMessage], notificationMessage => notificationMessage
);

export const getAppNotificationComponent = createSelector(
    [appNotification], notification => notification.component
);

export const getAppNotificationDesiredState = createSelector(
    [appNotification], notification => notification.desiredState
);