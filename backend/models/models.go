package models

type LocalizedString struct {
	En string `bson:"en" json:"en"`
	Fa string `bson:"fa" json:"fa"`
}

type Book struct {
	ID          string          `bson:"_id,omitempty" json:"id"`
	Title       LocalizedString `bson:"title" json:"title"`
	Author      LocalizedString `bson:"author" json:"author"`
	Translator  LocalizedString `bson:"translator,omitempty" json:"translator,omitempty"` // Optional
	Description LocalizedString `bson:"description" json:"description"`
	Image       string          `bson:"image" json:"image"`
	Link        string          `bson:"link" json:"link"`
	BtnText     LocalizedString `bson:"btnText" json:"btnText"`
	Category    string          `bson:"category" json:"category"` // "written" or "translated"
    Featured    bool            `bson:"featured" json:"featured"` // For hero carousel if needed, or just book list logic
}

type Hero struct {
    ID          string          `bson:"_id,omitempty" json:"id,omitempty"`
	Title       LocalizedString `bson:"title" json:"title"`
	Subtitle    LocalizedString `bson:"subtitle" json:"subtitle"`
	WrittenBtn  LocalizedString `bson:"writtenBtn" json:"writtenBtn"`
	TranslatedBtn LocalizedString `bson:"translatedBtn" json:"translatedBtn"`
	CallCaption LocalizedString `bson:"callCaption" json:"callCaption"`
    AboutTitle  LocalizedString `bson:"aboutTitle" json:"aboutTitle"`
    AboutText   LocalizedString `bson:"aboutText" json:"aboutText"`
    AboutImages []string        `bson:"aboutImages" json:"aboutImages"`
}
