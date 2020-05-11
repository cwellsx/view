export function toLocaleString(date: Date): string {
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  const year = new Date().getFullYear() === date.getFullYear() ? "" : ` '${("" + date.getFullYear()).substring(2)}`;
  const minutes = ("" + date.getMinutes()).padStart(2, "0");
  return `${month} ${date.getDate()}${year} at ${date.getHours()}:${minutes}`;
}
