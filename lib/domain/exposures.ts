export type HoldingExposureInput = {
  ticker: string;
  exposureType: string;
  exposureName: string;
  weight: number;
};

export type ExposureBucket = {
  key: string;
  label: string;
  exposureType: string;
  weight: number;
  marketValue: number;
  tickers: string[];
};

export type ExposureSnapshot = {
  totalMarketValue: number;
  buckets: ExposureBucket[];
};
