import toast from "react-hot-toast"

export const showToast = {
  success: (message: string) => {
    toast.success(message)
  },
  error: (message: string) => {
    toast.error(message)
  },
  info: (message: string) => {
    toast(message, {
      icon: "ℹ️",
    })
  },
  loading: (message: string) => {
    return toast.loading(message)
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  },
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },
}
