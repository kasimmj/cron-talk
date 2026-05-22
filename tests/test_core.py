from cron_talk import cron_talk, explain, validate


def test_every_minute():
    assert cron_talk("every minute") == "* * * * *"


def test_every_5_minutes():
    assert cron_talk("every 5 minutes") == "*/5 * * * *"


def test_every_hour():
    assert cron_talk("every hour") == "0 * * * *"


def test_weekdays_at_9am():
    assert cron_talk("every weekday at 9am") == "0 9 * * 1-5"


def test_arabic_every_5_minutes():
    assert cron_talk("كل 5 دقائق") == "*/5 * * * *"


def test_arabic_every_monday_9am():
    assert cron_talk("كل اثنين الساعة 9 صباحاً") == "0 9 * * 1"


def test_first_day_every_month():
    assert cron_talk("first day of every month") == "0 0 1 * *"


def test_validate_ok():
    assert validate("0 9 * * 1") == {"valid": True}


def test_validate_bad_hour():
    out = validate("0 25 * * *")
    assert out["valid"] is False


def test_explain_every_minute():
    assert explain("* * * * *") == "every minute"


def test_explain_weekdays():
    assert "weekday" in explain("0 9 * * 1-5")


def test_explain_arabic():
    out = explain("0 9 * * 1-5", locale="ar")
    assert "يوم عمل" in out
