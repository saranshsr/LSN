import { motion } from "motion/react";

import { StatusBar, BottomNav } from "../components/chrome";
import { SearchBar } from "../components/SearchBar";
import { Icon } from "../icons/Icon";
import { chrome, type Locale } from "../data/copy";

/**
 * Frame `1 · Home` (278:46104) — the designer's own Home, kept on legacy
 * components on his call. Geometry is taken straight from the frame:
 *
 *   hero            0 … 260      switcher x16 y52, tiles 73 × 76 on a 79 pitch
 *   address         x19 y144, 40 tall, heart button 36 at x319
 *   search bar      x15 y194, 343 × 48
 *   cashback ticket x12 y264, 351 × 62
 *   promo rail      y346, card 330 × 150 at x12, the next one peeks at x351
 *   section title   y524
 *   category rows   y564 and y708, tiles 92 × 128 on a 108 pitch from x16
 *   bottom nav      y724, 375 × 88
 *
 * The marketplace switcher is drawn in type — noon's switcher has no Field
 * component, and the real one is a row of brand lockups.
 */
export function HomeScreen({ locale, onSearch }: { locale: Locale; onSearch: () => void }) {
  const c = chrome[locale];
  return (
    <div className="screen screen--home">
      <StatusBar />
      <div className="scroll">
        <div className="home-hero">
          <Sparkles />
          <MarketplaceRail />

          <div className="home-address">
            <Icon name="bottomnav-home-filled" size={18} />
            <span className="home-address-label">{c.addressLabel}</span>
            <Icon name="system-chevron-down" size={16} />
            <span className="home-address-line">{c.address}</span>
            <button className="home-heart" aria-label="Saved"><Icon name="system-heart-filled" size={20} /></button>
          </div>

          <motion.div className="home-search" layoutId="searchbar">
            <SearchBar placeholder={c.searchPlaceholder} height={48} onClick={onSearch} />
          </motion.div>
        </div>

        <div className="home-content">
          {/* Ticket-shaped strip: two 12px notches bitten out of the side edges. */}
          <div className="cashback">
            <img className="cashback-art" src="/img/home/cashback-card.jpg" alt="" />
            <span className="cashback-title">{c.home.promoTitle}</span>
            <span className="cashback-sub">{c.home.promoSub}</span>
            <span className="cashback-pager">
              {c.home.pager}
              <span className="cashback-dots"><i /><i /><i /></span>
            </span>
          </div>

          <div className="hscroll promo-rail">
            <div className="promo">
              <img className="promo-art-l" src="/img/home/promo-left.jpg" alt="" />
              <img className="promo-art-r" src="/img/home/promo-right.jpg" alt="" />
              <span className="promo-ad">{c.home.promo.ad}</span>
              <div className="promo-copy">
                <span className="promo-eyebrow">{c.home.promo.eyebrow}</span>
                <span className="promo-amount">
                  <Icon name="local-dirham" size={22} />
                  {c.home.promo.amount.replace(/[^0-9]/g, "")}
                </span>
                <span className="promo-sub">{c.home.promo.title}</span>
                <span className="promo-sub promo-sub--tight">{c.home.promo.sub}</span>
                <span className="promo-code">{c.home.promo.code}</span>
              </div>
            </div>
            <div className="promo promo--peek" aria-hidden="true">
              <img className="promo-art-l" src="/img/home/promo-right.jpg" alt="" />
            </div>
          </div>
          <span className="promo-terms">{c.home.promo.terms}</span>

          <h2 className="home-section-title">{c.home.shopByCategory}</h2>
          {c.home.categories.map((row, r) => (
            <div className="hscroll cat-row" key={r}>
              {row.map((label, i) => (
                <span className="cat" key={`${r}-${i}`}>
                  <img src={`/img/home/cat-${(i % 4) + 1}.jpg`} alt="" />
                  <span>{label}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <BottomNav locale={locale} home />
    </div>
  );
}

/** The 2px white specks scattered over the hero in the frame. */
function Sparkles() {
  const dots = [[100, 32], [117, 17], [216, 138], [208, 31], [290, 19], [360, 142], [184, 30], [18, 12], [11, 124], [362, 14]];
  return (
    <div className="hero-sparkles" aria-hidden="true">
      {dots.map(([x, y]) => <i key={`${x}-${y}`} style={{ left: 11 + x, top: 12 + y }} />)}
    </div>
  );
}

/**
 * The marketplace switcher, copied from node `278:46145`.
 *
 * These are the real brand lockups exported from that node — SVG and PNG — not
 * type set to look like them. Tiles are 73 × 76 on a 79 pitch; the first five
 * are radius 15, Namshi and Pay are radius 8; the white ones sit at 95% opacity
 * and noon, Namshi and Pay carry `0 2px 4px rgba(0,0,0,0.04)`.
 *
 * The one substitution: the Namshi and Pay labels are Proxima Nova Bold 13 in
 * the frame, which is not a font we have. Noontree Bold at 13 stands in.
 */
function MarketplaceRail() {
  return (
    <div className="hscroll mp-rail">
      <span className="mp-tile mp-tile--noon">
        <img className="mp-noon-mark" src="/img/mp/noon-mark.svg" alt="noon" />
        <img className="mp-noon-word" src="/img/mp/noon-word.svg" alt="" />
      </span>

      <span className="mp-tile">
        <img className="mp-super" src="/img/mp/super.svg" alt="super" />
        <img className="mp-mall" src="/img/mp/mall.svg" alt="mall" />
      </span>

      <span className="mp-tile">
        <img className="mp-food" src="/img/mp/noon-food.svg" alt="noon FOOD" />
      </span>

      <span className="mp-tile">
        <img className="mp-mins" src="/img/mp/mins.png" alt="15 MINUTES" />
      </span>

      <span className="mp-tile">
        <img className="mp-brand5" src="/img/mp/brand5.svg" alt="" />
      </span>

      <span className="mp-tile mp-tile--sq">
        <img className="mp-namshi" src="/img/mp/namshi.png" alt="Namshi" />
        <span className="mp-label mp-label--namshi">Namshi</span>
      </span>

      <span className="mp-tile mp-tile--sq">
        <span className="mp-pay">
          <span className="mp-pay-back" />
          <span className="mp-pay-face" />
          <img className="mp-pay-a" src="/img/mp/pay-send-a.svg" alt="" />
          <img className="mp-pay-b" src="/img/mp/pay-send-b.svg" alt="" />
        </span>
        <span className="mp-label mp-label--pay">Pay</span>
      </span>
    </div>
  );
}
