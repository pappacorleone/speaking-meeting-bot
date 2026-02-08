import json
import os
import sys

from loguru import logger


def _json_sink(message):
    """Serialize loguru record to JSON for Cloud Run structured logging.

    Cloud Run automatically parses JSON log entries with a ``severity`` field.
    """
    record = message.record
    log_entry = {
        "severity": record["level"].name,
        "message": record["message"],
        "timestamp": record["time"].isoformat(),
        "logger": record["name"],
        "module": record["module"],
        "function": record["function"],
        "line": record["line"],
    }
    if record["extra"]:
        log_entry["extra"] = {k: str(v) for k, v in record["extra"].items()}
    if record["exception"]:
        log_entry["exception"] = str(record["exception"])
    sys.stderr.write(json.dumps(log_entry) + "\n")
    sys.stderr.flush()


def configure_logger(level="INFO"):
    """Configure loguru logger with environment-aware format.

    Reads ``LOG_LEVEL`` env var (overrides *level* param).
    Reads ``DIADI_ENV`` to choose between human-readable (development)
    and JSON (production) output formats.
    """
    logger.remove()

    log_level = os.getenv("LOG_LEVEL", level).upper()
    is_production = os.getenv("DIADI_ENV", "development") != "development"

    if is_production:
        # JSON format for Cloud Run structured logging
        logger.add(_json_sink, level=log_level, colorize=False)
    else:
        # Human-readable colored format for local development
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )
        logger.add(sys.stderr, format=log_format, level=log_level, colorize=True)

    return logger
