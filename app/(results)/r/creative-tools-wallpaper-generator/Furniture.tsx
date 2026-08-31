"use client";

/**
 * What the operating system puts on top.
 *
 * Drawn as guides rather than as a fake home screen: hairline icon wells, real
 * type in the clock and the menu bar, label bars where labels go. Everything is
 * positioned in the device's own points and scaled by one factor, so a dock is
 * the size a dock actually is relative to the sheet.
 */
import { furnitureFor, type Device } from "./engine/devices";
import s from "./furniture.module.css";

export type FurnitureShow = {
  clock: boolean;
  icons: boolean;
  chrome: boolean;
};

type Props = {
  device: Device;
  pxPerPt: number;
  show: FurnitureShow;
  /** macOS picks its menu bar type colour from the wallpaper. iOS does not. */
  lightChrome: boolean;
};

const MENU_ITEMS = ["Finder", "File", "Edit", "View", "Go", "Window", "Help"];

export default function Furniture({ device, pxPerPt, show, lightChrome }: Props) {
  const f = furnitureFor(device);
  const p = (v: number) => `${v * pxPerPt}px`;
  const desktop = device.kind === "laptop" || device.kind === "display";
  const any = show.clock || show.icons || show.chrome;

  return (
    <div className={s.layer} aria-hidden="true">
      {any && f.cornerPt > 0 && (
        <div className={s.corners} style={{ borderRadius: p(f.cornerPt) }} />
      )}

      {show.chrome && f.island && (
        <div
          className={s.island}
          style={{ left: p(f.island.x), top: p(f.island.y), width: p(f.island.w), height: p(f.island.h) }}
        />
      )}

      {show.chrome && f.menuBar && (
        <div
          className={`${s.menuBar} ${lightChrome ? s.light : s.dark}`}
          style={{ height: p(f.menuBar.h), fontSize: p(13), paddingInline: p(14) }}
        >
          <span className={s.menuLeft} style={{ gap: p(15) }}>
            <span className={s.apple} style={{ width: p(13), height: p(13) }} />
            {MENU_ITEMS.map((item, i) => (
              <span key={item} style={{ fontWeight: i === 0 ? 600 : 400 }}>
                {item}
              </span>
            ))}
          </span>
          <span className={s.menuRight} style={{ gap: p(13) }}>
            <span className={s.glyph} style={{ width: p(14), height: p(11) }} />
            <span className={s.glyph} style={{ width: p(22), height: p(11) }} />
            <span>Sun 9 Jun 21:40</span>
          </span>
          {f.menuBar.notch && (
            <div
              className={s.notch}
              style={{ left: p(f.menuBar.notch.x), width: p(f.menuBar.notch.w), height: p(f.menuBar.notch.h) }}
            />
          )}
        </div>
      )}

      {show.clock && (
        <div
          className={s.clock}
          style={{
            left: p(f.clock.box.x),
            top: p(f.clock.box.y),
            width: p(f.clock.box.w),
            textAlign: f.clock.align === "left" ? "left" : "center",
          }}
        >
          <div className={s.date} style={{ fontSize: p(f.clock.datePt), letterSpacing: p(0.2) }}>
            {desktop ? "Sunday 9 June" : "Sunday, 9 June"}
          </div>
          <div
            className={s.time}
            style={{ fontSize: p(f.clock.timePt), lineHeight: 1.04, letterSpacing: p(-f.clock.timePt * 0.02) }}
          >
            9:41
          </div>
        </div>
      )}

      {show.icons && !desktop && (
        <div className={s.grid} style={{ left: p(f.icons.box.x), top: p(f.icons.box.y) }}>
          {Array.from({ length: f.icons.cols * f.icons.rows }, (_, i) => {
            const col = i % f.icons.cols;
            const row = Math.floor(i / f.icons.cols);
            return (
              <div
                key={i}
                className={s.icon}
                style={{
                  left: p(col * f.icons.pitchX),
                  top: p(row * f.icons.pitchY),
                  width: p(f.icons.iconPt),
                  height: p(f.icons.iconPt),
                  borderRadius: p(f.icons.iconPt * 0.23),
                }}
              >
                <span
                  className={s.label}
                  style={{
                    width: p(f.icons.iconPt * 0.66),
                    height: p(Math.max(1.5, f.icons.iconPt * 0.055)),
                    bottom: p(-f.icons.iconPt * 0.2),
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {show.icons && desktop && f.desktopIcons && (
        <div className={s.grid} style={{ left: p(f.desktopIcons.x), top: p(f.desktopIcons.y) }}>
          {Array.from({ length: f.desktopIcons.count }, (_, i) => (
            <div
              key={i}
              className={s.icon}
              style={{
                left: 0,
                top: p(i * f.desktopIcons!.pitch),
                width: p(f.desktopIcons!.iconPt),
                height: p(f.desktopIcons!.iconPt),
                borderRadius: p(4),
              }}
            >
              <span
                className={s.label}
                style={{
                  width: p(f.desktopIcons!.iconPt * 0.8),
                  height: p(Math.max(1.5, f.desktopIcons!.iconPt * 0.06)),
                  bottom: p(-f.desktopIcons!.iconPt * 0.18),
                }}
              />
            </div>
          ))}
        </div>
      )}

      {show.chrome && (
        <div
          className={s.dock}
          style={{
            left: p(f.dock.box.x),
            top: p(f.dock.box.y),
            width: p(f.dock.box.w),
            height: p(f.dock.box.h),
            borderRadius: p(f.dock.radius),
            padding: p(desktop ? 8 : 12),
          }}
        >
          <div className={s.dockRow} style={{ gap: p(desktop ? 8 : 14) }}>
            {Array.from({ length: f.dock.icons }, (_, i) => (
              <span
                key={i}
                className={s.dockIcon}
                style={{
                  width: p(desktop ? 52 : 56),
                  height: p(desktop ? 52 : 56),
                  borderRadius: p(desktop ? 10 : 13),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {show.chrome && f.dock.pill && (
        <div
          className={s.pill}
          style={{
            left: p(f.dock.pill.x),
            top: p(f.dock.pill.y),
            width: p(f.dock.pill.w),
            height: p(f.dock.pill.h),
            borderRadius: p(f.dock.pill.h / 2),
          }}
        />
      )}

      {show.chrome && f.indicator && (
        <div
          className={s.indicator}
          style={{
            left: p(f.indicator.x),
            top: p(f.indicator.y),
            width: p(f.indicator.w),
            height: p(Math.max(2, f.indicator.h)),
            borderRadius: p(f.indicator.h),
          }}
        />
      )}
    </div>
  );
}
