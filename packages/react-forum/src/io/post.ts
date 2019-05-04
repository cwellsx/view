// the interfaces in this module declare the type of data posted to the server
// and used as input parameters in the functions of the ../io/index module.

export interface Login {
  userName: string,
  password: string
}