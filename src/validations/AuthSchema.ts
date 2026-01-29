import * as yup from 'yup';

import { accountValidator, confirmPasswordValidator, passwordValidator } from '.';

export const LoginSchema = yup.object({
  account: accountValidator('Vui lòng nhập email hoặc số điện thoại'),
  password: passwordValidator('Vui lòng nhập mật khẩu'),
});

export const ForgotPasswordSchema = yup.object({
  account: accountValidator('Vui lòng nhập email hoặc số điện thoại'),
  // otp: yup.string(),
});

export const ResetPasswordSchema = yup.object({
  password: passwordValidator('Vui lòng nhập mật khẩu mới').required(),
  confirmPassword: confirmPasswordValidator('Vui lòng nhập lại mật khẩu'),
});

export const RegisterSchema = yup.object({
  account: accountValidator('Vui lòng nhập email hoặc số điện thoại'),
  password: passwordValidator('Vui lòng nhập mật khẩu mới').required('Vui lòng nhập mật khẩu'),
  confirmPassword: confirmPasswordValidator('Vui lòng nhập lại mật khẩu').required(
    'Vui lòng nhập lại mật khẩu',
  ),
  // agreeToTerms: yup.boolean().oneOf([true], 'Bạn phải đồng ý với điều khoản sử dụng').required(),
});
