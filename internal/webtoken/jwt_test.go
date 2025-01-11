package webtoken

import (
	"reflect"
	"testing"
)

func Test_webToken_Generate(t *testing.T) {
	type fields struct {
		secret string
	}
	type args struct {
		c Claims
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "should generate a valid token",
			fields: fields{
				secret: "secret",
			},
			args: args{
				c: Claims{
					Email: "username",
				},
			},
			want:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiYWxkb3NhIiwic3ViIjoidXNlcm5hbWUiLCJhdWQiOlsiYmFsZG9zYSJdLCJleHAiOjE3Mzc4MzE3NDIsIm5iZiI6MTczNjYyMjE0MiwiaWF0IjoxNzM2NjIyMTQyLCJ1c2VybmFtZSI6InVzZXJuYW1lIn0.AR3h2LWVoylMUfe8cAKf8h3TowBo_M1lJ0mrPAgG_9U",
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := webToken{
				secret: tt.fields.secret,
			}
			got, err := w.Generate(tt.args.c)
			if (err != nil) != tt.wantErr {
				t.Errorf("Generate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("Generate() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_webToken_Validate(t *testing.T) {
	type fields struct {
		secret string
	}
	type args struct {
		token string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Claims
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := webToken{
				secret: tt.fields.secret,
			}
			got, err := w.Validate(tt.args.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Validate() got = %v, want %v", got, tt.want)
			}
		})
	}
}
