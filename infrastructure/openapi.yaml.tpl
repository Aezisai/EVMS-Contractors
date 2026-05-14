swagger: "2.0"
info:
  title: EVMS API Gateway
  description: Secure API Gateway for the EVMS calculation engine and microservices.
  version: "1.0.0"
schemes:
  - "https"
produces:
  - "application/json"
paths:
  /api/v1/engine/calculate:
    post:
      summary: "Trigger EVMS calculations"
      operationId: "calculateEVM"
      x-google-backend:
        address: "${engine_url}/calculate"
        path_translation: APPEND_PATH_TO_ADDRESS
      security:
        - firebase: []
      responses:
        200:
          description: "Calculation complete"
        401:
          description: "Unauthorized"

securityDefinitions:
  firebase:
    authorizationUrl: ""
    flow: "implicit"
    type: "oauth2"
    x-google-issuer: "https://securetoken.google.com/${project_id}"
    x-google-jwks_uri: "https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    x-google-audiences: "${project_id}"
