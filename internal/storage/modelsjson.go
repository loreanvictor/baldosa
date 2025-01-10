package storage

import (
	"encoding/json"
)

func (t *Tile) JSON() []byte {
	j, _ := json.Marshal(t)
	return j
}

func (t *Tile) FromJSON(data []byte) error {
	return json.Unmarshal(data, t)
}

func (u *User) JSON() []byte {
	j, _ := json.Marshal(u)
	return j
}

func (u *User) FromJSON(data []byte) error {
	return json.Unmarshal(data, u)
}
