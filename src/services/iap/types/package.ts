export interface Package {
  identifier: string;
  offeringIdentifier: string;
  packageType: string;
  product: {
    introPrice: number | null;
    priceString: string;
    currencyCode: string;
    description: string;
    pricePerWeek: number;
    subscriptionPeriod: string;
    identifier: string;
    discounts: any[];
    pricePerMonth: number;
    productCategory: string;
    pricePerWeekString: string;
    pricePerYearString: string;
    price: number;
    title: string;
    productType: 'AUTO_RENEWABLE_SUBSCRIPTION' | string;
    pricePerYear: number;
    pricePerMonthString: string;
  };
  presentedOfferingContext: {
    offeringIdentifier: string;
    placementIdentifier: null;
    targetingContext: null;
  };
}
