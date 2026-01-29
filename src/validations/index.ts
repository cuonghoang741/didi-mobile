import * as yup from 'yup';

// Allow phone numbers with 9-11 digits and the first number can be +84 or 0
export const phoneNumberRegex = /^(?:\+84|0(?!0))([0-9]{8,10})$/;
export const emailRegex =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i;

// Hàm kiểm tra email riêng biệt
const isValidEmail = (email: string): boolean => {
  // Kiểm tra cơ bản bằng regex
  if (!emailRegex.test(email)) return false;

  // Kiểm tra thêm để chặn các trường hợp đặc biệt
  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [, domain] = parts;

  // Kiểm tra domain không chứa nhiều hơn một dấu chấm liên tiếp
  if (domain.includes('..')) return false;

  // Kiểm tra domain không có dạng example.com.com
  const domainParts = domain.split('.');
  if (domainParts.length > 3) return false;

  // Nếu có 3 phần, kiểm tra phần cuối và phần gần cuối không giống nhau
  if (domainParts.length === 3 && domainParts[1].toLowerCase() === domainParts[2].toLowerCase()) {
    return false;
  }

  return true;
};

export const emailValidator = (requiredMessage?: string) => {
  let validator = yup.string().transform((value) => value?.trim());

  if (requiredMessage) {
    validator = validator.required(requiredMessage);
  }

  return validator.test(
    'valid-email',
    'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: example@email.com).',
    (value) => {
      if (!value) return true; // Bỏ qua nếu không có giá trị (xử lý required ở trên)
      return isValidEmail(value);
    },
  );
};

export const passwordValidator = (requiredMessage?: string) => {
  let validator = yup.string();

  if (requiredMessage) {
    validator = validator.required(requiredMessage);
  }

  return validator
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .concat(noWhitespaceString('Mật khẩu không được chứa khoảng trắng'));
};

export const phoneValidator = (message?: string) =>
  yup
    .string()
    .transform((value) => value?.trim())
    .required(message || 'Vui lòng nhập số điện thoại')
    .matches(phoneNumberRegex, 'Số điện thoại không hợp lệ. Vui lòng nhập số hợp lệ.')
    .transform((val) => (val === '' ? null : val));

export const dobValidator = (message?: string) =>
  yup
    .date()
    .max(new Date(), message || 'Ngày sinh không được là ngày trong tương lai')
    .transform((value) => (value instanceof Date && !isNaN(value.getTime()) ? value : null));

export const accountValidator = (message?: string) =>
  yup
    .string()
    .transform((value) => value?.trim())
    .required(message || 'Vui lòng nhập email hoặc số điện thoại.')
    .test('account', (value, ctx) => {
      if (!value) return false;

      // Đảm bảo value là string
      const strValue = String(value);

      // Kiểm tra email bằng hàm riêng biệt
      if (isValidEmail(strValue)) return true;

      // Kiểm tra số điện thoại
      if (phoneNumberRegex.test(strValue)) return true;

      // Nếu giống email nhưng không hợp lệ
      if (strValue.includes('@')) {
        return ctx.createError({
          message: 'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: example@email.com).',
        });
      }

      // Nếu giống số điện thoại nhưng không hợp lệ
      if (/^\d+$/.test(strValue)) {
        return ctx.createError({
          message: 'Số điện thoại không hợp lệ. Vui lòng nhập số hợp lệ.',
        });
      }

      // Nếu chứa chữ cái (không phải email hoặc số điện thoại)
      if (/[a-zA-Z]/.test(strValue)) {
        return ctx.createError({
          message: 'Định dạng không hợp lệ. Email phải có dạng example@email.com.',
        });
      }

      return ctx.createError({
        message: 'Vui lòng nhập email hoặc số điện thoại.',
      });
    });

export const noWhitespaceString = (message: string) =>
  yup.string().test('not-only-whitespace', message, (value) => {
    if (value !== undefined && value?.length > 0) return value.trim().length > 0;
    return true;
  });

export const confirmPasswordValidator = (requiredMessage?: string) => {
  return yup
    .string()
    .required(requiredMessage || 'Vui lòng nhập lại mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .concat(noWhitespaceString('Mật khẩu không được chứa khoảng trắng'))
    .test('passwords-match', 'Mật khẩu không trùng khớp', function (value) {
      // Chỉ kiểm tra trùng khớp khi đã nhập đủ 6 ký tự
      if (!value || value.length < 6) return true;
      return value === this.parent.password;
    });
};
