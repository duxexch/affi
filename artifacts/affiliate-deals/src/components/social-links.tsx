import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Phone, Globe, MessageCircle, Send } from "lucide-react";

type SocialLinksProps = {
    whatsapp?: string | null;
    telegram?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
};

function normalizeHref(raw: string | null | undefined): string | undefined {
    const v = raw?.trim();
    return v ? v : undefined;
}

function normalizeEmailHref(raw: string | null | undefined): string | undefined {
    const v = normalizeHref(raw);
    if (!v) return undefined;
    if (v.toLowerCase().startsWith("mailto:")) return v;
    if (v.includes("@")) return `mailto:${v}`;
    return v;
}

function normalizePhoneHref(raw: string | null | undefined): string | undefined {
    const v = normalizeHref(raw);
    if (!v) return undefined;
    if (v.toLowerCase().startsWith("tel:")) return v;
    return `tel:${v}`;
}

function shouldShow(raw: string | null | undefined): boolean {
    return !!normalizeHref(raw);
}

export function SocialLinks(props: SocialLinksProps) {
    const whatsappHref = normalizeHref(props.whatsapp);
    const telegramHref = normalizeHref(props.telegram);
    const facebookHref = normalizeHref(props.facebook);
    const instagramHref = normalizeHref(props.instagram);
    const emailHref = normalizeEmailHref(props.email);
    const phoneHref = normalizePhoneHref(props.phone);
    const websiteHref = normalizeHref(props.website);

    return (
        <div className="mt-6">
            {(shouldShow(props.whatsapp) ||
                shouldShow(props.telegram) ||
                shouldShow(props.facebook) ||
                shouldShow(props.instagram) ||
                shouldShow(props.email) ||
                shouldShow(props.phone) ||
                shouldShow(props.website)) && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-extrabold tracking-tight">Contact & Social</h2>

                        <div className="flex flex-wrap gap-2">
                            {phoneHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={phoneHref} aria-label="Phone">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call
                                    </a>
                                </Button>
                            )}

                            {emailHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={emailHref} aria-label="Email">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Email
                                    </a>
                                </Button>
                            )}

                            {whatsappHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        WhatsApp
                                    </a>
                                </Button>
                            )}

                            {telegramHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={telegramHref} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                                        <Send className="h-4 w-4 mr-2" />
                                        Telegram
                                    </a>
                                </Button>
                            )}

                            {facebookHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={facebookHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Facebook
                                    </a>
                                </Button>
                            )}

                            {instagramHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Instagram
                                    </a>
                                </Button>
                            )}

                            {websiteHref && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={websiteHref} target="_blank" rel="noopener noreferrer" aria-label="Website">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Website
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
}
