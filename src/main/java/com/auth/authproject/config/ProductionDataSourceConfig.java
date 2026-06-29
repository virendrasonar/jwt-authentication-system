package com.auth.authproject.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
@Profile("prod")
public class ProductionDataSourceConfig {

    @Bean
    public DataSource dataSource(@Value("${DATABASE_URL}") String databaseUrl,
                                 @Value("${DB_USERNAME:}") String dbUsername,
                                 @Value("${DB_PASSWORD:}") String dbPassword) {
        DatabaseConnection connection = parseDatabaseUrl(databaseUrl);

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(connection.jdbcUrl());
        dataSource.setUsername(dbUsername.isBlank() ? connection.username() : dbUsername);
        dataSource.setPassword(dbPassword.isBlank() ? connection.password() : dbPassword);
        dataSource.setDriverClassName("org.postgresql.Driver");

        return dataSource;
    }

    private DatabaseConnection parseDatabaseUrl(String databaseUrl) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            throw new IllegalStateException("DATABASE_URL is required for prod profile");
        }

        if (databaseUrl.startsWith("jdbc:postgresql://")) {
            return new DatabaseConnection(databaseUrl, "", "");
        }

        URI uri = URI.create(databaseUrl);

        if (!uri.getScheme().equals("postgresql") && !uri.getScheme().equals("postgres")) {
            throw new IllegalStateException("DATABASE_URL must start with postgresql:// or jdbc:postgresql://");
        }

        String userInfo = uri.getUserInfo();
        String username = "";
        String password = "";

        if (userInfo != null) {
            String[] parts = userInfo.split(":", 2);
            username = decode(parts[0]);
            password = parts.length > 1 ? decode(parts[1]) : "";
        }

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String query = uri.getQuery() == null ? "" : "?" + uri.getQuery();
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath() + query;

        return new DatabaseConnection(jdbcUrl, username, password);
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private record DatabaseConnection(String jdbcUrl, String username, String password) {}
}
