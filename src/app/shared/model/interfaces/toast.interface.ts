export interface IToast {
  title: string,
  message: string,
  date: Date,
  type: 'primary' | 'danger' | 'success' | 'warning' | 'error' | 'info'
}
