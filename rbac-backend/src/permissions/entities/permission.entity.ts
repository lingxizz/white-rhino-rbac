import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, Tree, TreeChildren, TreeParent } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

export enum PermissionType {
  MENU = 'menu',
  API = 'api',
  BUTTON = 'button',
}

@Entity('permissions')
@Tree('materialized-path')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PermissionType,
    default: PermissionType.MENU,
  })
  type: PermissionType;

  @Column({ nullable: true })
  path: string;

  @Column({ nullable: true })
  component: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  status: boolean;

  @Column({ nullable: true })
  description: string;

  @TreeParent()
  parent: Permission;

  @TreeChildren()
  children: Permission[];

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
