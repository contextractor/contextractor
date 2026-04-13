"""Tests for CrawlConfig."""

import pytest

from contextractor_cli.config import CrawlConfig, validate_save_formats


def test_default_config_has_sensible_defaults():
    cfg = CrawlConfig()
    assert cfg.urls == []
    assert cfg.max_pages == 0
    assert cfg.output_dir == "./output"
    assert cfg.crawl_depth == 0
    assert cfg.headless is True
    assert cfg.save == ["markdown"]
    assert cfg.trafilatura_config.favor_precision is False
    assert cfg.trafilatura_config.include_links is True


def test_merge_overlays_crawl_fields():
    cfg = CrawlConfig()
    cfg.merge({"max_pages": 10, "save": ["json", "xml"], "output_dir": "/tmp/out"})
    assert cfg.max_pages == 10
    assert cfg.save == ["json", "xml"]
    assert cfg.output_dir == "/tmp/out"


def test_merge_routes_extraction_fields():
    cfg = CrawlConfig()
    cfg.merge({"favor_precision": True, "include_links": False, "deduplicate": True})
    assert cfg.trafilatura_config.favor_precision is True
    assert cfg.trafilatura_config.include_links is False
    assert cfg.trafilatura_config.deduplicate is True


def test_merge_skips_none_values():
    cfg = CrawlConfig()
    cfg.merge({"max_pages": None, "save": None, "favor_precision": None})
    assert cfg.max_pages == 0
    assert cfg.save == ["markdown"]
    assert cfg.trafilatura_config.favor_precision is False


def test_merge_ignores_unknown_keys():
    cfg = CrawlConfig()
    cfg.merge({"unknown_key": "value", "another_unknown": 42})
    # Should not raise


def test_from_file_still_works(tmp_path):
    config_file = tmp_path / "config.json"
    config_file.write_text('{"urls": ["https://example.com"], "maxPages": 5, "save": ["json", "xml"], "trafilaturaConfig": {"favorPrecision": true}}')
    cfg = CrawlConfig.from_file(config_file)
    assert cfg.urls == ["https://example.com"]
    assert cfg.max_pages == 5
    assert cfg.save == ["json", "xml"]
    assert cfg.trafilatura_config.favor_precision is True


def test_file_values_then_merge_precedence(tmp_path):
    config_file = tmp_path / "config.json"
    config_file.write_text('{"urls": ["https://example.com"], "maxPages": 5, "save": ["json"]}')
    cfg = CrawlConfig.from_file(config_file)
    cfg.merge({"max_pages": 20, "save": ["text", "xml"]})
    assert cfg.max_pages == 20
    assert cfg.save == ["text", "xml"]
    # Unmerged fields keep file values
    assert cfg.urls == ["https://example.com"]


# --- Tests for v0.3.0+ config options ---


def test_from_dict_proxy_section():
    data = {
        "proxy": {
            "urls": ["http://proxy1:8080", "http://proxy2:8080"],
            "rotation": "per_request",
        }
    }
    cfg = CrawlConfig.from_dict(data)
    assert cfg.proxy_urls == ["http://proxy1:8080", "http://proxy2:8080"]
    assert cfg.proxy_rotation == "per_request"


def test_from_dict_proxy_tiered():
    data = {
        "proxy": {
            "tiered": [
                [None],
                ["http://datacenter:8080"],
                ["http://residential:8080"],
            ]
        }
    }
    cfg = CrawlConfig.from_dict(data)
    assert cfg.proxy_tiered == [[None], ["http://datacenter:8080"], ["http://residential:8080"]]
    # proxy_urls should be empty when only tiered is set
    assert cfg.proxy_urls == []


def test_from_dict_browser_settings():
    data = {
        "launcher": "FIREFOX",
        "waitUntil": "NETWORKIDLE",
        "pageLoadTimeoutSecs": 120,
        "ignoreCorsAndCsp": True,
        "closeCookieModals": True,
        "maxScrollHeightPixels": 10000,
        "ignoreSslErrors": True,
        "userAgent": "Mozilla/5.0 Custom",
    }
    cfg = CrawlConfig.from_dict(data)
    assert cfg.launcher == "firefox"
    assert cfg.wait_until == "networkidle"
    assert cfg.page_load_timeout == 120
    assert cfg.ignore_cors is True
    assert cfg.close_cookie_modals is True
    assert cfg.max_scroll_height == 10000
    assert cfg.ignore_ssl_errors is True
    assert cfg.user_agent == "Mozilla/5.0 Custom"


def test_from_dict_crawl_filtering():
    data = {
        "globs": ["https://example.com/**"],
        "excludes": ["*.pdf"],
        "linkSelector": "a.nav-link",
        "keepUrlFragments": True,
        "respectRobotsTxtFile": True,
    }
    cfg = CrawlConfig.from_dict(data)
    assert cfg.globs == ["https://example.com/**"]
    assert cfg.excludes == ["*.pdf"]
    assert cfg.link_selector == "a.nav-link"
    assert cfg.keep_url_fragments is True
    assert cfg.respect_robots_txt is True


def test_from_dict_cookies_headers():
    cookies = [{"name": "session", "value": "abc", "domain": ".example.com"}]
    headers = {"Authorization": "Bearer token123"}
    # Test camelCase aliases
    cfg1 = CrawlConfig.from_dict({"initialCookies": cookies, "customHttpHeaders": headers})
    assert cfg1.cookies == cookies
    assert cfg1.headers == headers
    # Test snake_case aliases
    cfg2 = CrawlConfig.from_dict({"cookies": cookies, "headers": headers})
    assert cfg2.cookies == cookies
    assert cfg2.headers == headers


def test_from_dict_concurrency():
    # Apify-style keys
    cfg1 = CrawlConfig.from_dict({
        "maxConcurrency": 20,
        "maxRequestRetries": 5,
        "maxResultsPerCrawl": 100,
    })
    assert cfg1.max_concurrency == 20
    assert cfg1.max_retries == 5
    assert cfg1.max_results == 100
    # CLI-style keys
    cfg2 = CrawlConfig.from_dict({
        "maxConcurrency": 30,
        "maxRetries": 2,
        "maxResults": 50,
    })
    assert cfg2.max_concurrency == 30
    assert cfg2.max_retries == 2
    assert cfg2.max_results == 50


def test_from_dict_save_list():
    cfg = CrawlConfig.from_dict({"save": ["xml", "json"]})
    assert cfg.save == ["xml", "json"]


def test_from_dict_save_default():
    cfg = CrawlConfig.from_dict({})
    assert cfg.save == ["markdown"]


def test_validate_save_formats_all():
    result = validate_save_formats(["all"])
    assert result == sorted({"markdown", "html", "text", "json", "jsonl", "xml", "xml-tei"})


def test_validate_save_formats_invalid():
    with pytest.raises(ValueError, match="Unknown save format"):
        validate_save_formats(["invalid"])


def test_validate_save_formats_dedup():
    result = validate_save_formats(["json", "xml", "json"])
    assert result == ["json", "xml"]


def test_save_list_merge():
    cfg = CrawlConfig()
    assert cfg.save == ["markdown"]
    cfg.merge({"save": ["json", "xml"]})
    assert cfg.save == ["json", "xml"]


def test_merge_new_crawl_fields():
    cfg = CrawlConfig()
    cfg.merge({
        "proxy_urls": ["http://p:8080"],
        "launcher": "firefox",
        "globs": ["*.html"],
        "user_agent": "Custom/1.0",
        "proxy_tiered": [[None], ["http://tier1:8080"]],
    })
    assert cfg.proxy_urls == ["http://p:8080"]
    assert cfg.launcher == "firefox"
    assert cfg.globs == ["*.html"]
    assert cfg.user_agent == "Custom/1.0"
    assert cfg.proxy_tiered == [[None], ["http://tier1:8080"]]


def test_from_dict_case_normalization():
    cfg = CrawlConfig.from_dict({"launcher": "CHROMIUM", "waitUntil": "NETWORKIDLE"})
    assert cfg.launcher == "chromium"
    assert cfg.wait_until == "networkidle"


def test_from_dict_page_load_timeout_alias():
    # pageLoadTimeout (CLI-style) fallback
    cfg = CrawlConfig.from_dict({"pageLoadTimeout": 90})
    assert cfg.page_load_timeout == 90
    # pageLoadTimeoutSecs (Apify-style) takes precedence
    cfg2 = CrawlConfig.from_dict({"pageLoadTimeoutSecs": 120, "pageLoadTimeout": 90})
    assert cfg2.page_load_timeout == 120


# --- Dual-case config acceptance tests ---


def test_from_dict_snake_case_keys():
    cfg = CrawlConfig.from_dict({
        "max_pages": 10,
        "output_dir": "/tmp/out",
        "crawl_depth": 2,
        "save": ["json", "xml"],
    })
    assert cfg.max_pages == 10
    assert cfg.output_dir == "/tmp/out"
    assert cfg.crawl_depth == 2
    assert cfg.save == ["json", "xml"]


def test_from_dict_camel_case_keys():
    cfg = CrawlConfig.from_dict({
        "maxPages": 10,
        "outputDir": "/tmp/out",
        "crawlDepth": 2,
        "save": ["json", "xml"],
    })
    assert cfg.max_pages == 10
    assert cfg.output_dir == "/tmp/out"
    assert cfg.crawl_depth == 2
    assert cfg.save == ["json", "xml"]


def test_from_dict_mixed_case_keys():
    cfg = CrawlConfig.from_dict({
        "maxPages": 5,
        "output_dir": "/tmp/mixed",
        "crawl_depth": 3,
        "save": ["json"],
    })
    assert cfg.max_pages == 5
    assert cfg.output_dir == "/tmp/mixed"
    assert cfg.crawl_depth == 3
    assert cfg.save == ["json"]


def test_from_dict_camel_case_proxy_rotation():
    cfg = CrawlConfig.from_dict({
        "proxy": {"rotation": "perRequest"},
    })
    assert cfg.proxy_rotation == "per_request"


def test_from_dict_snake_case_proxy_rotation():
    cfg = CrawlConfig.from_dict({
        "proxy": {"rotation": "per_request"},
    })
    assert cfg.proxy_rotation == "per_request"


def test_from_dict_camel_case_until_failure():
    cfg = CrawlConfig.from_dict({
        "proxy": {"rotation": "untilFailure"},
    })
    assert cfg.proxy_rotation == "until_failure"


def test_from_dict_snake_case_trafilatura_config_key():
    cfg = CrawlConfig.from_dict({
        "trafilatura_config": {
            "favor_precision": True,
            "include_links": False,
        },
    })
    assert cfg.trafilatura_config.favor_precision is True
    assert cfg.trafilatura_config.include_links is False


def test_from_dict_snake_case_browser_settings():
    cfg = CrawlConfig.from_dict({
        "wait_until": "NETWORKIDLE",
        "page_load_timeout": 90,
        "ignore_cors": True,
        "ignore_ssl_errors": True,
        "user_agent": "Custom/1.0",
        "max_scroll_height": 8000,
    })
    assert cfg.wait_until == "networkidle"
    assert cfg.page_load_timeout == 90
    assert cfg.ignore_cors is True
    assert cfg.ignore_ssl_errors is True
    assert cfg.user_agent == "Custom/1.0"
    assert cfg.max_scroll_height == 8000


def test_from_dict_snake_case_crawl_filtering():
    cfg = CrawlConfig.from_dict({
        "link_selector": "a.nav",
        "keep_url_fragments": True,
        "respect_robots_txt": True,
    })
    assert cfg.link_selector == "a.nav"
    assert cfg.keep_url_fragments is True
    assert cfg.respect_robots_txt is True
