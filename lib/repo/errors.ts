export class RepoError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RepoError";
  }
}

export class ClientNotFoundError extends RepoError {
  constructor(public readonly clientId: string) {
    super(`Client not found: ${clientId}`);
    this.name = "ClientNotFoundError";
  }
}

export class CorruptArtifactError extends RepoError {
  constructor(
    public readonly clientId: string,
    public readonly artifactPath: string,
    cause: unknown,
  ) {
    super(`Corrupt or invalid artifact at ${artifactPath} (client ${clientId})`, cause);
    this.name = "CorruptArtifactError";
  }
}

export class SlugCollisionError extends RepoError {
  constructor(public readonly slug: string) {
    super(`Slug already in use: ${slug}`);
    this.name = "SlugCollisionError";
  }
}
