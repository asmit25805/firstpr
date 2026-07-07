/** An error with an HTTP status and a message that's safe to show the user directly. */
export class AppError extends Error {
  status: number;
  publicMessage: string;

  constructor(status: number, publicMessage: string) {
    super(publicMessage);
    this.name = 'AppError';
    this.status = status;
    this.publicMessage = publicMessage;
  }
}
