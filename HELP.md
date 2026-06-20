# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.6/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.6/maven-plugin/build-image.html)
* [Spring Boot Testcontainers support](https://docs.spring.io/spring-boot/4.0.6/reference/testing/testcontainers.html#testing.testcontainers)
* [Testcontainers Postgres Module Reference Guide](https://java.testcontainers.org/modules/databases/postgres/)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.6/reference/web/servlet.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.6/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Spring Security](https://docs.spring.io/spring-boot/4.0.6/reference/web/spring-security.html)
* [Validation](https://docs.spring.io/spring-boot/4.0.6/reference/io/validation.html)
* [Spring Boot Actuator](https://docs.spring.io/spring-boot/4.0.6/reference/actuator/index.html)
* [Java Mail Sender](https://docs.spring.io/spring-boot/4.0.6/reference/io/email.html)
* [Spring Configuration Processor](https://docs.spring.io/spring-boot/4.0.6/specification/configuration-metadata/annotation-processor.html)
* [Flyway Migration](https://docs.spring.io/spring-boot/4.0.6/how-to/data-initialization.html#howto.data-initialization.migration-tool.flyway)
* [Spring Data Reactive Redis](https://docs.spring.io/spring-boot/4.0.6/reference/data/nosql.html#data.nosql.redis)
* [Redis Search and Query Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/redis.html)
* [OAuth2 Authorization Server](https://docs.spring.io/spring-boot/4.0.6/reference/web/spring-security.html#web.security.oauth2.authorization-server)
* [Spring Reactive Web](https://docs.spring.io/spring-boot/4.0.6/reference/web/reactive.html)
* [Reactive HTTP Client](https://docs.spring.io/spring-boot/4.0.6/reference/io/rest-client.html#io.rest-client.webclient)
* [SpringDoc OpenAPI](https://springdoc.org/)
* [Quartz Scheduler](https://docs.spring.io/spring-boot/4.0.6/reference/io/quartz.html)
* [Testcontainers](https://java.testcontainers.org/)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
* [Validation](https://spring.io/guides/gs/validating-form-input/)
* [Building a RESTful Web Service with Spring Boot Actuator](https://spring.io/guides/gs/actuator-service/)
* [Messaging with Redis](https://spring.io/guides/gs/messaging-redis/)
* [Building a Reactive RESTful Web Service](https://spring.io/guides/gs/reactive-rest-service/)
* [SpringDoc OpenAPI](https://github.com/springdoc/springdoc-openapi-demos/)

### Testcontainers support

This project uses [Testcontainers at development time](https://docs.spring.io/spring-boot/4.0.6/reference/features/dev-services.html#features.dev-services.testcontainers).

Testcontainers has been configured to use the following Docker images:

* [`postgres:latest`](https://hub.docker.com/_/postgres)
* [`redis:latest`](https://hub.docker.com/_/redis)
* [`redis/redis-stack:latest`](https://hub.docker.com/r/redis/redis-stack)

Please review the tags of the used images and set them to the same as you're running in production.

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

