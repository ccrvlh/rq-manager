import os
import threading

from typing import Any
from typing import Literal
from typing import Optional
from typing import get_args
from typing import get_origin
from logging import getLogger
from pathlib import Path
from dataclasses import asdict
from dataclasses import fields
from dataclasses import dataclass

import tomllib

from dotenv import load_dotenv


logger = getLogger(__name__)


@dataclass
class AppConfig(object):
    # Internals
    _INITIALIZED: bool = False
    _LOCK = threading.Lock()
    _INSTANCE: Optional["AppConfig"] = None
    _INIT_LOCK = threading.Lock()

    # App Settings
    APP_ENV: str = ""
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_NGINX_PORT: int = 7777
    APP_LOG_LEVEL: str = "INFO"
    APP_DEBUG: bool = False
    APP_RELOAD: bool = False
    APP_WORKERS: int = 1
    APP_MASTER_TOKEN: str = ""
    APP_ENCRYPTION_KEY: str = ""
    APP_OPEN_TELEMETRY_KEY: str = ""

    # Redis Configuration
    APP_REDIS_HOST: str = "localhost"
    APP_REDIS_PORT: int = 6379
    APP_REDIS_DB: int = 0
    APP_REDIS_PASSWORD: str = ""
    APP_REDIS_URL: str = ""
    APP_REDIS_SSL: bool = False
    APP_REDIS_TIMEOUT: int = 5

    # Analytics
    APP_ANALYTICS_DB_PATH: str = "data/analytics.db"
    APP_ANALYTICS_RETENTION_DAYS: int = 7
    APP_ANALYTICS_COLLECTION_INTERVAL: int = 1
    APP_ANALYTICS_ENABLED: bool = True

    def __new__(cls):
        """Create and return the singleton instance of AppConfig.

        Returns:
            AppConfig: The singleton instance of the configuration class.
        """
        if cls._INSTANCE is None:
            with cls._LOCK:
                if cls._INSTANCE is None:
                    cls._INSTANCE = super(AppConfig, cls).__new__(cls)
                    # Initialize instance attributes safely
                    with cls._INIT_LOCK:
                        if not hasattr(cls._INSTANCE, '_INITIALIZED'):
                            cls._INSTANCE._INITIALIZED = False
        return cls._INSTANCE

    def __getattr__(self, key: str) -> Any:
        """Get a configuration attribute by key.

        Args:
            key: The name of the configuration attribute to retrieve.

        Returns:
            Any: The value of the configuration attribute.

        Raises:
            Exception: If settings have not been initialized.
            AttributeError: If the requested setting doesn't exist.
        """
        is_initialized = super().__getattribute__("_INITIALIZED")
        if not is_initialized:
            raise Exception("Settings were not initialized. Check your `.env` file")
        try:
            return super().__getattribute__(key)
        except AttributeError:
            raise AttributeError(f"Setting {key} doesn't exist. Check your .env file.")

    def __getitem__(self, key: str) -> Any:
        """Get a configuration attribute by key using dictionary syntax.

        Args:
            key: The name of the configuration attribute to retrieve.

        Returns:
            Any: The value of the configuration attribute.

        Raises:
            Exception: If settings have not been initialized.
            AttributeError: If the requested setting doesn't exist.
        """
        is_initialized = super().__getattribute__("_INITIALIZED")
        if not is_initialized:
            raise Exception("Settings were not initialized. Check your `.env` file")
        try:
            return super().__getattribute__(key)
        except AttributeError:
            print(f"Setting {key} doesn't exist. Check your .env file.")
            raise AttributeError(f"Setting {key} doesn't exist. Check your .env file.")

    def get(self, key: str) -> Any:
        """Get a configuration attribute by key safely.

        Args:
            key: The name of the configuration attribute to retrieve.

        Returns:
            Any: The value of the configuration attribute.

        Raises:
            Exception: If settings have not been initialized.
        """
        is_initialized = super().__getattribute__("_INITIALIZED")
        if not is_initialized:
            raise Exception("Settings were not initialized. Check your `.env` file")
        return self.__getattr__(key)

    def to_dict(self) -> dict[str, Any]:
        """Convert the configuration object to a dictionary.

        Returns:
            dict[str, Any]: A dictionary representation of all configuration values.
        """
        return asdict(self)

    @classmethod
    def get_instance(cls):
        """Get the singleton instance of AppConfig.

        Returns:
            AppConfig: The singleton instance of the configuration class.
        """
        return cls()

    @classmethod
    def is_initialized(cls) -> bool:
        """Check if the AppConfig has been properly initialized.

        Returns:
            bool: True if the configuration has been initialized, False otherwise.
        """
        instance = cls.get_instance()
        return instance._INITIALIZED


class AppConfigBuilder:
    def __init__(self, target: AppConfig, env: str = "dev"):
        """Initialize the AppConfigBuilder.

        Args:
            target: The target AppConfig class to build.
            env: The environment to build configuration for (e.g., "dev", "prod").
        """
        self.env = env
        self.settings_files = ["settings.toml", "secrets.toml"]
        self._config_object: Optional[dict[str, Any]] = None
        self._secrets_object: Optional[dict[str, Any]] = None
        self._loaded_vars: Optional[dict[str, Any]] = {}
        self._target_class = target
        self.config_file = None
        self.settings = None

    @property
    def config_object(self) -> dict[str, Any]:
        """Get the configuration object.

        Returns:
            dict[str, Any]: The configuration dictionary, empty if not loaded.
        """
        if not self._config_object:
            return {}
        return self._config_object

    @property
    def secrets_object(self) -> dict[str, Any]:
        """Get the secrets object.

        Returns:
            dict[str, Any]: The secrets dictionary, empty if not loaded.
        """
        if not self._secrets_object:
            return {}
        return self._secrets_object

    @property
    def loaded_vars(self) -> dict[str, Any]:
        """Get the loaded variables dictionary.

        Returns:
            dict[str, Any]: The loaded configuration variables dictionary.
        """
        if not self._loaded_vars:
            self._loaded_vars = {}
        return self._loaded_vars

    @property
    def target_class(self) -> AppConfig:
        """Get the target configuration class.

        Returns:
            AppConfig: The target configuration class instance.

        Raises:
            ValueError: If no target class was initialized.
        """
        if not self._target_class:
            raise ValueError("No target class object initialized")
        return self._target_class

    def _cast_value(self, field_type: type, value: Any) -> Any:
        """Cast the value to the appropriate type based on the field's type annotation.
        Args:
            field_type (type): The type annotation of the field.
            value (Any): The value to be casted.
        Returns:
            Any: The casted value.
        """
        if value is None:
            return None

        origin = get_origin(field_type)
        if origin is Optional:
            field_type = get_args(field_type)[0]
            if value is None:
                return None

        if origin is Literal:
            allowed_values = get_args(field_type)
            if str(value) not in allowed_values:
                raise ValueError(f"Value '{value}' not in allowed values {allowed_values}")
            return str(value)

        # Get the actual type for basic types
        actual_type = field_type if isinstance(field_type, type) else type(field_type)

        # Handle basic types
        if actual_type == bool:
            if isinstance(value, str):
                return value.lower() in ('true', '1', 'yes', 'on')
            return bool(value)
        elif actual_type == int:
            return int(str(value))
        elif actual_type == float:
            return float(str(value))
        elif actual_type == str:
            return str(value)

        return value

    def _load_files(self) -> None:
        """
        Loads configuration and secrets from TOML files if they exist.
        This method checks for the presence of "settings.toml" and ".secrets.toml"
        files in the repository root directory. If these files are found, it loads their
        contents into the `_config_object` and `_secrets_object` attributes
        respectively using the `tomllib` library.
        Raises:
            FileNotFoundError: If either "settings.toml" or ".secrets.toml" is not found.
        """
        # Get the repository root directory (parent of api directory)
        repo_root = Path(__file__).parent.parent.parent

        settings_path = repo_root / "settings.toml"
        if settings_path.is_file():
            with open(settings_path, mode="rb") as fp:
                self._config_object = tomllib.load(fp)

        secrets_path = repo_root / ".secrets.toml"
        if secrets_path.is_file():
            with open(secrets_path, mode="rb") as fp:
                self._secrets_object = tomllib.load(fp)

    def _load_defaults(self) -> None:
        """
        Loads default configuration values from the config object.
        This method retrieves the "default" section from the config object. If the
        "default" section is present, it loads the values into the current configuration.
        Returns:
            None
        """
        defaults: Optional[dict[str, Any]] = self.config_object.get("default", None)
        if defaults is None:
            return
        self._load_values(defaults)

    def _load_settings_env(self) -> None:
        """
        Loads environment-specific settings into the configuration object.
        This method retrieves a dictionary of settings for the current environment
        from the configuration object. If no settings are found for the environment,
        the method returns without making any changes. If settings are found, they
        are loaded into the configuration object.
        Returns:
            None
        """
        env_dict: Optional[dict[str, Any]] = self.config_object.get(self.env, None)
        if env_dict is None:
            return
        self._load_values(env_dict)

    def _load_secrets_default(self) -> None:
        """
        Loads the default secrets from the secrets object and updates the configuration values.
        This method retrieves the "default" secrets from the `secrets_object`. If the "default" secrets
        are not found, the method returns without making any changes. If the "default" secrets are found,
        it updates the configuration values using the `_load_values` method.
        Returns:
            None
        """
        secrets_dict: Optional[dict[str, Any]] = self.secrets_object.get("default", None)
        if secrets_dict is None:
            return
        self._load_values(secrets_dict)

    def _load_secrets_env(self) -> None:
        """
        Loads secrets from the environment-specific secrets dictionary and updates the configuration values.
        This method retrieves the secrets dictionary for the current environment from the `secrets_object`.
        If no secrets dictionary is found for the current environment, the method returns without making any changes.
        If a secrets dictionary is found, it updates the configuration values using the `_load_values` method.
        Returns:
            None
        """
        secrets_dict: Optional[dict[str, Any]] = self.secrets_object.get(self.env, None)
        if secrets_dict is None:
            return
        self._load_values(secrets_dict)

    def _load_envvars(self) -> None:
        """
        Loads environment variables from .env files and processes them.
        First loads from .env files, then processes environment variables
        by removing RQM_ prefix.
        """
        # Load from .env files
        repo_root = Path(__file__).parent.parent.parent
        env_files = [".env", f".env.{self.env}"]

        for env_file in env_files:
            env_path = repo_root / env_file
            if env_path.is_file():
                load_dotenv(env_path)

        # Process environment variables
        env_vars = {}
        for key, value in os.environ.items():
            new_key = key
            if key.startswith("RQM_"):
                new_key = key.replace("RQM_", "")
            env_vars[new_key] = value
        self._load_values(env_vars)

    def _load_values(self, source_object: dict[Any, Any]) -> None:
        """
        Loads values from the given source object into the loaded_vars dictionary.
        Args:
            source_object (dict[Any, Any]): A dictionary containing key-value pairs to be loaded.
        """
        self.loaded_vars.update(source_object)

    def _set_values(self) -> None:
        """
        Sets values from `loaded_vars` to the attributes of `target_class` if the keys match the field names.
        This method iterates over the items in `loaded_vars` and the fields of `target_class`. If a key in `loaded_vars`
        matches a field name in `target_class`, it attempts to cast the value to the field's type and set the attribute
        on `target_class`. If casting fails, a warning is logged and the default value is retained.
        Raises:
            ValueError: If the value cannot be cast to the field's type.
            TypeError: If the value cannot be cast to the field's type.
        """
        for key, value in self.loaded_vars.items():
            for _field in fields(self.target_class):
                if key == _field.name:
                    try:
                        actual_type = _field.type if isinstance(_field.type, type) else type(_field.type)
                        casted_value = self._cast_value(actual_type, value)
                        setattr(self.target_class, _field.name, casted_value)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Failed to cast {key}={value} to type {_field.type}: {str(e)}. Keeping original values.")
                        continue

    def load(self) -> None:
        """
        Load configuration by performing the following steps:
        1. Load configuration files.
        2. Load default settings.
        3. Load settings from environment variables.
        4. Load default secrets.
        5. Load secrets from environment variables.
        6. Load additional environment variables.
        7. Set the loaded values to the target class.
        After all steps are completed, mark the target class as initialized.
        """
        self._load_files()
        self._load_defaults()
        self._load_settings_env()
        self._load_secrets_default()
        self._load_secrets_env()
        self._load_envvars()
        self._set_values()
        self.target_class._INITIALIZED = True

    def export(self) -> dict[str, Any]:
        """
        Exports the target class instance to a dictionary.
        Returns:
            dict: A dictionary representation of the target class instance.
        """
        raw_dict = self.target_class.to_dict()
        return raw_dict


settings = AppConfig()
