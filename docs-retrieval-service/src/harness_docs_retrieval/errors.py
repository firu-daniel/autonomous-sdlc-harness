"""The service's one anticipated-failure type.

The rule this module exists to enforce: an anticipated failure — a refusal, a missing cache, an
unreachable database — is raised as `ServiceError` and nothing else, and only `cli.main` turns it
into an exit status. Anything that is not a `ServiceError` is a bug and propagates with its
traceback.
"""


class ServiceError(Exception):
    """An anticipated failure; its message is the one line the operator sees."""
