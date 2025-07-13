/****************************************************
 * Try Catch Wrapper
 ****************************************************

 Example Usage

  const [result, error] = await tryCatch(async () => {
    const result = await somePromise()
    return result
  })

  if (error) {
    console.error(error)
  } else {
    console.log(result)
  }

/**************************************************** */

export default async function tryCatch<T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const result = await promise
    return [result, null]
  } catch (error) {
    const er = error as Error
    return [null, er]
  }
}
