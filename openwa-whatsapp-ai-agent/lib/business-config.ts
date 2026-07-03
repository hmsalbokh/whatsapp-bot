export interface BusinessConfig {
  name: string;
  description: string;
  hours: string;
  tone: string;
  shippingInfo: string;
}

export function getBusinessConfig(): BusinessConfig {
  return {
    name: process.env.BUSINESS_NAME || 'الشركة',
    description: process.env.BUSINESS_DESCRIPTION || '',
    hours: process.env.BUSINESS_HOURS || '',
    tone: process.env.BUSINESS_TONE || 'محترف ومهذب',
    shippingInfo:
      process.env.BUSINESS_SHIPPING_INFO ||
      'الشحن يستغرق 2-5 أيام عمل داخل المملكة. التوصيل مجاني للطلبات فوق 200 ريال.',
  };
}
