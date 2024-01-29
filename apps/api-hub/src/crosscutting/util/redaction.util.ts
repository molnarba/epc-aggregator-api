export class RedactionUtil {
  private static readonly CENSOR: string = `*** redacted by ${RedactionUtil.name} ***`;

  private static readonly REDACTION: string[] = ['password', 'authorization', 'cookie'];

  static readactKeys(data: any): any {
    // gigo
    if (data === undefined || data === null) {
      return data;
    }

    // create a copy of the data with censored values for logging
    let dataCopy: any = JSON.parse(JSON.stringify(data));
    Object.keys(dataCopy).forEach((key: string) => {
      let lowerCaseKey: string = key.toLowerCase();
      for (let i = 0; i < RedactionUtil.REDACTION.length; i++) {
        if (lowerCaseKey === RedactionUtil.REDACTION[i]) {
          if (Array.isArray(dataCopy[key])) {
            for (let i = 0; i < dataCopy[key].length; i++) {
              dataCopy[key][i] = RedactionUtil.CENSOR;
            }
          } else {
            dataCopy[key] = RedactionUtil.CENSOR;
          }
        }
      }
    });

    return dataCopy;
  }
}
