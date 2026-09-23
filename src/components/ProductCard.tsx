import { Icon } from "../icons/Icon";
import { chrome, type Locale } from "../data/copy";
import type { Product } from "../data/products";

/**
 * The legacy "Product card / PLP Default" as the frames use it — not
 * M-Product Card. Every value maps to a Field token; the handful with no token
 * (the 80% white scrims, the 10px Ad label) are set literally in app.css.
 */
export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const c = chrome[locale].card;
  return (
    <article className="card">
      <div className="card-media">
        <img src={product.photo} alt="" />
        <span className="card-flag">{c.bestSeller}</span>
        <span className="card-heart"><Icon name="system-heart" size={16} /></span>
        {product.ad ? <span className="card-ad">{c.ad}</span> : null}
        <span className="card-dots">
          {[6, 6, 4, 2].map((d, i) => <i key={i} style={{ width: d, height: d }} />)}
        </span>
        <span className="card-add"><Icon name="system-plus" size={20} /></span>
      </div>

      <div className="card-deal">{c.megaDeal}</div>

      <div className="card-body">
        <h3 className="card-title">{product.title[locale]}</h3>

        <span className="card-rating">
          <Icon name="system-star-filled" size={12} color="var(--colour-text-n-icon-success)" />
          <b>{product.rating}</b>
          <span>({product.ratingCount})</span>
        </span>

        <div className="card-price">
          <span className="card-price-now">
            {c.currency.kind === "mark" ? <Icon name="local-dirham" size={15} /> : <span>{c.currency.value}</span>}
            {product.price}
          </span>
          <span className="card-price-was">{product.wasPrice}</span>
          <span className="card-price-off">{product.discountPct}%</span>
        </div>

        <div className="card-lowest">
          <Icon name="system-arrow-down-circle-filled" size={14} color="var(--colour-text-n-icon-error)" />
          <span>{c.lowestPrice}</span>
        </div>

        <div className="card-coupons">
          <span className="coupon">{c.extraOff}</span>
          <span className="coupon">{c.plusThree}</span>
        </div>

        <div className="card-express">
          <span className="express-pill">{c.express}</span>
          <span className="card-eta">{c.getBy}</span>
        </div>
      </div>
    </article>
  );
}
