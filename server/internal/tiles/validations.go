package tiles

import (
	"errors"
	"net/url"
	"regexp"
)

var (
	ErrorInvalidLink = errors.New("invalid link")

	telLinkRegexp = regexp.MustCompile(`^tel:\+[0-9]{5,16}$`)
)

func ValidateLink(link string) error {
	if !isValidHTTPSLink(link) && !isValidTelLink(link) {
		return ErrorInvalidLink
	}
	return nil
}

func isValidHTTPSLink(link string) bool {
	parsedURL, err := url.Parse(link)
	if err != nil || !parsedURL.IsAbs() {
		return false
	}
	return parsedURL.Scheme == "https"
}

func isValidTelLink(link string) bool {
	matched := telLinkRegexp.MatchString(link)
	return matched
}
