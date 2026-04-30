package com.auth.authproject.dto;

public class UserResponseDTO {

    private Long id;
    private String name;
    private String email;

    // getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }

    // setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
}