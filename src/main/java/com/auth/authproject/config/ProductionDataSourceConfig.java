package com.auth.authproject.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
@Profile("prod")
public class ProductionDataSourceConfig {

    @Bean
    public DataSource dataSource(Environment environment) {
        String databaseUrl = firstPresent(
                environment.getProperty("DATABASE_URL"),
                environment.getProperty("SPRING_DATASOURCE_URL"),
                environment.getProperty("POSTGRES_URL")
        );
        String dbUsername = firstPresent(
                environment.getProperty("DB_USERNAME"),
                environment.getProperty("SPRING_DATASOURCE_USERNAME")
        );
        String dbPassword = firstPresent(
                environment.getProperty("DB_PASSWORD"),
                environment.getProperty("SPRING_DATASOURCE_PASSWORD")
        );

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
            throw new IllegalStateException(
                    "Production database URL is required. Set DATABASE_URL to your Render internal PostgreSQL URL."
            );
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

    private String firstPresent(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return "";
    }

    private record DatabaseConnection(String jdbcUrl, String username, String password) {}
}
