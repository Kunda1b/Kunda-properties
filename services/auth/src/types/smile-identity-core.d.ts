declare module "smile-identity-core" {
  export class WebApi {
    constructor(
      partnerId: string,
      callbackUrl: string,
      apiKey: string,
      sidServer: string,
    );

    submit_job(
      partnerParams: Record<string, unknown>,
      imageDetails: unknown[],
      idInfo: Record<string, unknown>,
      options: Record<string, unknown>,
    ): Promise<Record<string, any>>;
  }
}
