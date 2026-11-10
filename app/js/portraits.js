window.FD = window.FD || {};

// Original medallion busts, one per commander. Inline SVG strings: no ids,
// no external references, no text, sized entirely by CSS.
(function () {
  var INK = '#2a2520', OX = '#7b2d26', GREEN = '#2f5d50', BRASS = '#a07a2c';
  var SKIN = '#e6cba6', SHADE = '#b98f63', WHITE = '#f7f1e3';

  // Shoulder silhouette whose lower edge follows the medallion rim.
  var SHOULDERS = 'M10.5 53C13 45.5 20 43.5 26.5 41.5L37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 10.5 53Z';

  function wrap(ground, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<circle cx="32" cy="32" r="30" fill="' + ground + '"/>' +
      '<circle cx="32" cy="32" r="26.6" fill="none" stroke="' + INK + '" stroke-opacity=".16" stroke-width=".6"/>' +
      inner +
      '<circle cx="32" cy="32" r="29.6" fill="none" stroke="' + BRASS + '" stroke-width="2.2"/>' +
      '<circle cx="32" cy="32" r="31" fill="none" stroke="' + INK + '" stroke-opacity=".35" stroke-width=".6"/>' +
      '</svg>';
  }

  function shoulders(fill) {
    return '<path d="' + SHOULDERS + '" fill="' + fill + '"/>';
  }

  function neck(skin) {
    return '<path d="M28 32L28 42.5Q32 46 36 42.5L36 32Z" fill="' + skin + '"/>' +
      '<path d="M28 36.5Q32 40 36 36.5L36 39Q32 42 28 39Z" fill="' + SHADE + '" fill-opacity=".55"/>';
  }

  function head(skin, cy) {
    cy = cy || 26.5;
    return '<ellipse cx="32" cy="' + cy + '" rx="8.3" ry="10.2" fill="' + skin + '"/>' +
      // engraver's shadow down one side of the face
      '<path d="M32 ' + (cy - 10.2) + 'A8.3 10.2 0 0 1 32 ' + (cy + 10.2) + 'A5 10.2 0 0 0 32 ' + (cy - 10.2) + 'Z" fill="' + SHADE + '" fill-opacity=".38"/>';
  }

  var P = {};

  // Alexander: tousled hair, upswept forelock, thin diadem, pinned cloak.
  P.alexander = wrap('#e4d7b9',
    shoulders(OX) +
    '<path d="M26.5 41.5L32 50L37.5 41.5Q32 45 26.5 41.5Z" fill="' + WHITE + '"/>' +
    '<path d="M14 49Q24 46 31 55M50 49Q43 48 38 54" fill="none" stroke="' + INK + '" stroke-opacity=".35" stroke-width=".9" stroke-linecap="round"/>' +
    '<circle cx="42.5" cy="45.5" r="2.3" fill="' + BRASS + '" stroke="' + INK + '" stroke-opacity=".5" stroke-width=".5"/>' +
    // hair behind the head, falling to the nape
    '<path d="M21.5 35C18.5 30 19 19 24.5 15C26 10.5 30.5 10 32 12.5C34 9 39 10.5 39.5 14.5C45 18 45.5 30 42.5 35C41 37 38.5 36.5 38 34L26 34C25.5 36.5 23 37 21.5 35Z" fill="#9a6f2a"/>' +
    neck(SKIN) + head(SKIN) +
    // fringe with the forelock swept up off the brow
    '<path d="M22.6 27C21.5 21 23.5 16.5 27 15C28.5 12 31.5 12 32.5 14.5C34 11.5 38 12.5 38.5 15.5C41.5 17.5 42.5 22 41.4 27C40.8 23.5 39.5 21.5 37.5 20.5C36 21.5 34 20.5 33 18C32.5 20.5 30.5 22 28 21C25 21.5 23.2 23.5 22.6 27Z" fill="#9a6f2a"/>' +
    '<path d="M27 15.5C28.5 17 30.5 17 32.5 14.5M33 18C34.5 17.5 36.5 16.5 38.5 15.5M24.5 15.5C24 18 24.5 19.5 26 20.5" fill="none" stroke="#5f4216" stroke-width=".8" stroke-linecap="round"/>' +
    // diadem
    '<path d="M21.4 22.6Q32 15.4 42.6 22.6" fill="none" stroke="' + WHITE + '" stroke-width="1.7" stroke-linecap="round"/>' +
    '<path d="M21.4 22.6Q32 15.4 42.6 22.6" fill="none" stroke="' + INK + '" stroke-opacity=".3" stroke-width=".5" transform="translate(0 1.1)"/>'
  );

  // Hannibal: crested bronze helmet, dark beard, green cloak.
  P.hannibal = wrap('#e4d7b9',
    shoulders(GREEN) +
    '<path d="M24 42.2L32 53L40 42.2L37.5 41.5L26.5 41.5Z" fill="' + BRASS + '"/>' +
    '<path d="M13 50Q22 46.5 30 56M51 50Q42 46.5 34 56" fill="none" stroke="' + INK + '" stroke-opacity=".4" stroke-width=".9" stroke-linecap="round"/>' +
    neck('#d2ac80') + head('#d2ac80') +
    // beard
    '<path d="M23.6 27C23.6 36.5 27.5 41.5 32 41.5C36.5 41.5 40.4 36.5 40.4 27C39 30.5 36 31.8 32 31.8C28 31.8 25 30.5 23.6 27Z" fill="' + INK + '"/>' +
    // crest
    '<path d="M19.5 17.5C21 5.5 43 5.5 44.5 17.5C40.5 11.5 23.5 11.5 19.5 17.5Z" fill="' + OX + '"/>' +
    '<path d="M24 11.2L25.5 13.6M28 9.4L28.8 12.2M32 8.8L32 11.8M36 9.4L35.2 12.2M40 11.2L38.5 13.6" stroke="' + INK + '" stroke-opacity=".4" stroke-width=".7" stroke-linecap="round"/>' +
    // helmet bowl, brow band and cheek pieces
    '<path d="M22 25C21 15.5 26.5 12 32 12C37.5 12 43 15.5 42 25Z" fill="' + BRASS + '"/>' +
    '<path d="M32 12C37.5 12 43 15.5 42 25L36 25C37 19 35.5 14 32 12Z" fill="' + INK + '" fill-opacity=".18"/>' +
    '<path d="M21.6 23.2L42.4 23.2L42.4 26L33.2 26L32 28.6L30.8 26L21.6 26Z" fill="#7d5d1c"/>' +
    '<path d="M21.6 26L25.4 26C25.2 29.5 26 32.5 27.6 35C24.5 34.5 22 31 21.6 26ZM42.4 26L38.6 26C38.8 29.5 38 32.5 36.4 35C39.5 34.5 42 31 42.4 26Z" fill="' + BRASS + '"/>'
  );

  // Caesar: laurel wreath, white toga with a purple stripe.
  P.caesar = wrap('#dccdaa',
    shoulders(WHITE) +
    '<path d="M26.5 41.5L31 48L37.5 41.5Q32 45 26.5 41.5Z" fill="#d9cdb4"/>' +
    // toga fold with its purple border, falling from the wearer's left shoulder
    '<path d="M47.5 46.2C41 47.5 33.5 52 28 61.6L33.4 62C36.5 55.5 43.5 50 51.2 48.6Z" fill="#6b2a4d"/>' +
    '<path d="M15 49.5Q22 50 26 60M19 46.5Q26 48 30.5 55" fill="none" stroke="' + INK + '" stroke-opacity=".3" stroke-width=".9" stroke-linecap="round"/>' +
    neck(SKIN) + head(SKIN) +
    // thin, cropped hair
    '<path d="M23.7 25C23 18.5 27.5 16.2 32 16.2C36.5 16.2 41 18.5 40.3 25C39.3 21.5 36.5 20 32 20C27.5 20 24.7 21.5 23.7 25Z" fill="#857b6b"/>' +
    // laurel
    '<g fill="' + GREEN + '">' +
    '<ellipse cx="22.2" cy="27.5" rx="4" ry="1.9" transform="rotate(-82 22.2 27.5)"/>' +
    '<ellipse cx="22.2" cy="22.2" rx="4" ry="1.9" transform="rotate(-68 22.2 22.2)"/>' +
    '<ellipse cx="24.3" cy="17.6" rx="4" ry="1.9" transform="rotate(-48 24.3 17.6)"/>' +
    '<ellipse cx="28" cy="14.8" rx="4" ry="1.9" transform="rotate(-22 28 14.8)"/>' +
    '<ellipse cx="41.8" cy="27.5" rx="4" ry="1.9" transform="rotate(82 41.8 27.5)"/>' +
    '<ellipse cx="41.8" cy="22.2" rx="4" ry="1.9" transform="rotate(68 41.8 22.2)"/>' +
    '<ellipse cx="39.7" cy="17.6" rx="4" ry="1.9" transform="rotate(48 39.7 17.6)"/>' +
    '<ellipse cx="36" cy="14.8" rx="4" ry="1.9" transform="rotate(22 36 14.8)"/>' +
    '</g>' +
    '<g fill="#3f7a69">' +
    '<ellipse cx="24.6" cy="24.6" rx="3" ry="1.4" transform="rotate(-60 24.6 24.6)"/>' +
    '<ellipse cx="26.4" cy="19.8" rx="3" ry="1.4" transform="rotate(-40 26.4 19.8)"/>' +
    '<ellipse cx="39.4" cy="24.6" rx="3" ry="1.4" transform="rotate(60 39.4 24.6)"/>' +
    '<ellipse cx="37.6" cy="19.8" rx="3" ry="1.4" transform="rotate(40 37.6 19.8)"/>' +
    '</g>'
  );

  // Napoleon: black bicorne worn square, dark coat with white lapels.
  P.napoleon = wrap('#e4d7b9',
    shoulders('#27334d') +
    // white lapels and waistcoat
    '<path d="M25.2 42L19.5 45.2L26.5 61L37.5 61L44.5 45.2L38.8 42L32 51.5Z" fill="' + WHITE + '"/>' +
    '<path d="M32 51.5L32 62" stroke="' + INK + '" stroke-opacity=".35" stroke-width=".8"/>' +
    '<circle cx="29.3" cy="55" r=".9" fill="' + BRASS + '"/><circle cx="34.7" cy="55" r=".9" fill="' + BRASS + '"/>' +
    // epaulettes
    '<path d="M11.8 50.5C13 46.8 17 45 20.5 44.6L21.5 47.6C18.5 48.2 15.5 50 14.2 52.8ZM52.2 50.5C51 46.8 47 45 43.5 44.6L42.5 47.6C45.5 48.2 48.5 50 49.8 52.8Z" fill="' + BRASS + '"/>' +
    neck(SKIN) +
    // red collar
    '<path d="M25.6 38.6L28.6 40.2L31 46L26.2 42.6ZM38.4 38.6L35.4 40.2L33 46L37.8 42.6Z" fill="' + OX + '"/>' +
    // hair at the temples
    '<path d="M23.4 22C22.6 26 23 30 24.6 32.5C24.6 29 24.8 25.5 25.8 22ZM40.6 22C41.4 26 41 30 39.4 32.5C39.4 29 39.2 25.5 38.2 22Z" fill="#3a2a1e"/>' +
    head(SKIN, 28) +
    '<path d="M24 23.5C26 20.5 29 21.5 31 23C28.5 22.6 26 22.8 24 23.5Z" fill="#3a2a1e"/>' +
    // bicorne
    '<path d="M8.6 24.2C14 13.5 24 8.4 32 8.4C40 8.4 50 13.5 55.4 24.2C48 21.2 40.5 20.4 32 20.4C23.5 20.4 16 21.2 8.6 24.2Z" fill="' + INK + '"/>' +
    '<path d="M12.5 21.4C19 18.6 25.5 17.8 32 17.8C38.5 17.8 45 18.6 51.5 21.4" fill="none" stroke="' + WHITE + '" stroke-opacity=".28" stroke-width=".7"/>' +
    '<circle cx="38.6" cy="14.2" r="2.3" fill="' + WHITE + '"/><circle cx="38.6" cy="14.2" r="1.3" fill="' + OX + '"/>'
  );

  // Turenne: long dark wig, cuirass, white cravat and sash.
  P.turenne = wrap('#dccdaa',
    shoulders('#6c7479') +
    '<path d="M37.5 41.5C44 43.5 51 45.5 53.5 53A30 30 0 0 1 32 62L32 41.5Z" fill="' + INK + '" fill-opacity=".2"/>' +
    '<path d="M32 46L32 62" stroke="' + WHITE + '" stroke-opacity=".5" stroke-width=".8"/>' +
    // sash across the breastplate
    '<path d="M44.5 44.4L49.5 46.6L27.5 61.6L21 60.2Z" fill="' + WHITE + '"/>' +
    neck(SKIN) +
    // cravat
    '<path d="M27 39.6Q32 42.6 37 39.6L38.4 46.6L32 51L25.6 46.6Z" fill="' + WHITE + '"/>' +
    '<path d="M29 43L32 50M35 43L32 50M32 42.4L32 50" stroke="' + INK + '" stroke-opacity=".28" stroke-width=".7" stroke-linecap="round"/>' +
    head(SKIN, 27) +
    // wig
    '<path d="M32 11.5C23.5 10.5 18.5 16.5 18.8 25C19 31 16 35.5 14.4 40.5C13 45.5 16 50 20.6 49.6C25.4 49.2 27.4 45 26.6 40.5C25.8 35.5 24 31.5 24.2 27C24.4 22.5 27 20.4 32 18.6C37 20.4 39.6 22.5 39.8 27C40 31.5 38.2 35.5 37.4 40.5C36.6 45 38.6 49.2 43.4 49.6C48 50 51 45.5 49.6 40.5C48 35.5 45 31 45.2 25C45.5 16.5 40.5 10.5 32 11.5Z" fill="#3b2a20"/>' +
    '<path d="M32 12L32 18.4M21.5 26C21 31.5 18.5 36 17.6 41M42.5 26C43 31.5 45.5 36 46.4 41M18.5 44.5Q21 46.5 23.8 44.5M40.2 44.5Q43 46.5 45.5 44.5M27 15.5Q24 18.5 23.5 22.5M37 15.5Q40 18.5 40.5 22.5" fill="none" stroke="#7a604c" stroke-width=".8" stroke-linecap="round"/>'
  );

  FD.PORTRAITS = P;
  FD.portrait = function (id) { return FD.PORTRAITS[id] || ''; };
})();
