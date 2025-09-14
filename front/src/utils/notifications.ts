import { notifications } from '@mantine/notifications';

export function showSuccessNotification(notification: { message?: string; title?: string }) {
  return notifications.show({
    color: 'green',
    title: notification.title ?? 'Success',
    message: notification.message ?? 'Operation completed successfully',
    autoClose: 5000,
  });
}

export function showErrorNotification(notification: { message?: string; title?: string }) {
  return notifications.show({
    color: 'red',
    title: notification.title ?? 'Error',
    message: notification.message ?? 'An error occurred',
    autoClose: 5000,
  });
}

export function showWarningNotification(notification: { message?: string; title?: string }) {
  return notifications.show({
    color: 'yellow',
    title: notification.title ?? 'Warning',
    message: notification.message ?? 'Something unexpected happened',
    autoClose: 5000,
  });
}
