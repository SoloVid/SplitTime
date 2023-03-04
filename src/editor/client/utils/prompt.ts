import { debug } from "api/system"
import swal from "sweetalert"

export async function prompt(promptText: string): Promise<string | null> {
  const result = await swal({
    title: promptText,
    content: "input" as any,
    buttons: true as any,
  })
  return result
}

export async function showError(errorText: string) {
  await swal({
    title: "Oh noes!",
    text: errorText,
    icon: "error",
  })
}

export async function warningConfirmation(confirmationText: string, confirmationTitle?: string): Promise<boolean> {
  const result = await swal({
    title: confirmationTitle ?? "Are you sure?",
    text: confirmationText,
    icon: "warning",
    buttons: true as any,
    dangerMode: true,
  })
  return result ?? false
}
