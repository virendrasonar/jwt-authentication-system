package com.auth.authproject.dto;

public class ForgotPasswordResponse {

    private String message;
    private String resetToken;
    private String resetUrl;

    public ForgotPasswordResponse() {}

    public ForgotPasswordResponse(String message, String resetToken, String resetUrl) {
        this.message = message;
        this.resetToken = resetToken;
        this.resetUrl = resetUrl;
    }

    public String getMessage() { return message; }
    public String getResetToken() { return resetToken; }
    public String getResetUrl() { return resetUrl; }

    public void setMessage(String message) { this.message = message; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public void setResetUrl(String resetUrl) { this.resetUrl = resetUrl; }
}
