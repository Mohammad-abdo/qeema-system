import toast from "react-hot-toast";
import Swal from "sweetalert2";

/**
 * Centralized notification service.
 * Use these instead of window.alert or inline alert logic.
 */

export function success(message) {
  toast.success(message);
}

export function error(message) {
  toast.error(message);
}

export function warning(message) {
  toast(message, { icon: "⚠️" });
}

export function info(message) {
  toast(message, { icon: "ℹ️" });
}

/**
 * Confirmation dialog (e.g. before delete).
 * @param {Object} options - { title?, text?, confirmButtonText?, cancelButtonText?, icon? }
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export function confirm(options = {}) {
  const {
    title = "Are you sure?",
    text = "This action cannot be undone.",
    confirmButtonText = "Yes",
    cancelButtonText = "Cancel",
    icon = "warning",
    showCancelButton = true,
  } = options;

  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
  }).then((result) => Boolean(result.isConfirmed));
}
