package com.auth.authproject.dto;

public class LoginRequestDTO {

    private String email;
    private String password;

    // getters
    public String getEmail() { return email; }
    public String getPassword() { return password; }

    // setters
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
}