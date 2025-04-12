import { Column } from 'typeorm';

export class Location {
  @Column({ type: 'number', nullable: false }) // Supposant que X et Y sont requis si location existe
  x: number;

  @Column({ type: 'number', nullable: false })
  y: number;
}
